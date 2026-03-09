-- ============================================================
-- MÓDULO DE COMPRAS — Ordeon ERP
-- Tablas: suppliers, purchase_orders, purchase_order_items,
--         supplier_payments
-- ============================================================

-- ─── PROVEEDORES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code           TEXT,
  name           TEXT NOT NULL,
  rtn            TEXT,
  contact_name   TEXT,
  phone          TEXT,
  email          TEXT,
  address        TEXT,
  city           TEXT,
  department     TEXT,
  country        TEXT DEFAULT 'Honduras',
  credit_limit   NUMERIC(14,2) DEFAULT 0,
  current_balance NUMERIC(14,2) DEFAULT 0,  -- saldo adeudado al proveedor
  payment_terms  TEXT DEFAULT '30 días',
  notes          TEXT,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS suppliers_company_idx ON suppliers(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_company_code_idx ON suppliers(company_id, code) WHERE code IS NOT NULL;

-- ─── ÓRDENES DE COMPRA ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  po_number       SERIAL,               -- número correlativo por empresa (se maneja vía secuencia)
  supplier_id     UUID NOT NULL REFERENCES suppliers(id),
  warehouse_id    UUID REFERENCES warehouses(id),
  status          TEXT NOT NULL DEFAULT 'borrador'
                  CHECK (status IN ('borrador','enviada','recibida_parcial','recibida','cancelada')),
  order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date   DATE,
  received_date   DATE,
  payment_terms   TEXT DEFAULT '30 días',
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  isv_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  received_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchase_orders_company_idx  ON purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_idx ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS purchase_orders_status_idx   ON purchase_orders(status);

-- Secuencia de número de OC por empresa (usamos trigger)
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(po_number), 0) + 1
    INTO next_num
    FROM purchase_orders
   WHERE company_id = NEW.company_id;
  NEW.po_number := next_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_po_number ON purchase_orders;
CREATE TRIGGER trg_po_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION generate_po_number();

-- ─── LÍNEAS DE ORDEN DE COMPRA ───────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id           UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id),
  quantity        NUMERIC(14,4) NOT NULL CHECK (quantity > 0),
  qty_received    NUMERIC(14,4) NOT NULL DEFAULT 0,
  unit_cost       NUMERIC(14,4) NOT NULL CHECK (unit_cost >= 0),
  isv_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  isv_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total      NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS poi_po_idx      ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS poi_product_idx ON purchase_order_items(product_id);

-- ─── PAGOS A PROVEEDORES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id     UUID NOT NULL REFERENCES suppliers(id),
  po_id           UUID REFERENCES purchase_orders(id),
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method  TEXT NOT NULL DEFAULT 'transferencia'
                  CHECK (payment_method IN ('efectivo','transferencia','cheque','tarjeta','otro')),
  reference       TEXT,         -- número de cheque, transferencia, etc.
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sp_company_idx  ON supplier_payments(company_id);
CREATE INDEX IF NOT EXISTS sp_supplier_idx ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS sp_po_idx       ON supplier_payments(po_id);

-- ─── RLS (Row Level Security) ────────────────────────────────
ALTER TABLE suppliers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

-- Política: acceso solo para usuarios de la misma empresa
CREATE POLICY "suppliers_company_policy" ON suppliers
  USING (company_id = (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "purchase_orders_company_policy" ON purchase_orders
  USING (company_id = (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "purchase_order_items_company_policy" ON purchase_order_items
  USING (po_id IN (
    SELECT id FROM purchase_orders
    WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "supplier_payments_company_policy" ON supplier_payments
  USING (company_id = (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- ─── FUNCIÓN: Recibir OC ─────────────────────────────────────
-- Recibe items[], actualiza qty_received, stock de productos,
-- y cambia el estado de la OC según corresponda.
CREATE OR REPLACE FUNCTION receive_purchase_order(
  p_po_id        UUID,
  p_received_by  UUID,
  p_items        JSONB   -- [{item_id, qty_received}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item         JSONB;
  v_item_row     purchase_order_items%ROWTYPE;
  v_po           purchase_orders%ROWTYPE;
  v_total_items  INT;
  v_fully_recv   INT;
  v_new_status   TEXT;
BEGIN
  -- Obtener OC
  SELECT * INTO v_po FROM purchase_orders WHERE id = p_po_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'OC no encontrada');
  END IF;
  IF v_po.status = 'cancelada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'OC cancelada');
  END IF;
  IF v_po.status = 'recibida' THEN
    RETURN jsonb_build_object('success', false, 'error', 'OC ya recibida completamente');
  END IF;

  -- Procesar cada ítem
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_item_row
      FROM purchase_order_items
     WHERE id = (v_item->>'item_id')::UUID AND po_id = p_po_id;

    IF NOT FOUND THEN CONTINUE; END IF;

    DECLARE
      v_qty_recv NUMERIC := (v_item->>'qty_received')::NUMERIC;
      v_max_recv NUMERIC := v_item_row.quantity - v_item_row.qty_received;
    BEGIN
      IF v_qty_recv <= 0 THEN CONTINUE; END IF;
      IF v_qty_recv > v_max_recv THEN v_qty_recv := v_max_recv; END IF;

      -- Actualizar qty_received en el ítem
      UPDATE purchase_order_items
         SET qty_received = qty_received + v_qty_recv
       WHERE id = v_item_row.id;

      -- Actualizar stock del producto (tabla products)
      UPDATE products
         SET stock = stock + v_qty_recv,
             updated_at = NOW()
       WHERE id = v_item_row.product_id;

      -- Si hay bodega, actualizar warehouse_stock
      IF v_po.warehouse_id IS NOT NULL THEN
        INSERT INTO warehouse_stock (warehouse_id, product_id, stock, min_stock, stock_reserved)
        VALUES (v_po.warehouse_id, v_item_row.product_id, v_qty_recv, 0, 0)
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET stock = warehouse_stock.stock + v_qty_recv, updated_at = NOW();
      END IF;
    END;
  END LOOP;

  -- Calcular nuevo estado
  SELECT COUNT(*) INTO v_total_items FROM purchase_order_items WHERE po_id = p_po_id;
  SELECT COUNT(*) INTO v_fully_recv
    FROM purchase_order_items
   WHERE po_id = p_po_id AND qty_received >= quantity;

  IF v_fully_recv = v_total_items THEN
    v_new_status := 'recibida';
  ELSE
    v_new_status := 'recibida_parcial';
  END IF;

  UPDATE purchase_orders
     SET status        = v_new_status,
         received_date = CURRENT_DATE,
         received_by   = p_received_by,
         updated_at    = NOW()
   WHERE id = p_po_id;

  RETURN jsonb_build_object('success', true, 'new_status', v_new_status);
END;
$$;

-- ─── TRIGGER: updated_at automático ───────────────────────────
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_suppliers_updated ON suppliers;
CREATE TRIGGER trg_suppliers_updated
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_po_updated ON purchase_orders;
CREATE TRIGGER trg_po_updated
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

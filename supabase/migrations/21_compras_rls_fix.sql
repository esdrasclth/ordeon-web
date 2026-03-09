-- ============================================================
-- FIX DEFINITIVO: Eliminar TODAS las políticas de compras
-- y re-crearlas correctamente con FOR + WITH CHECK
-- ============================================================

-- Limpiar TODAS las políticas existentes de las 4 tablas
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE tablename IN ('suppliers','purchase_orders','purchase_order_items','supplier_payments')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ─── SUPPLIERS ────────────────────────────────────────────────
CREATE POLICY "suppliers_select" ON suppliers
  FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE
  USING    (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "suppliers_delete" ON suppliers
  FOR DELETE USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- ─── PURCHASE ORDERS ─────────────────────────────────────────
CREATE POLICY "po_select" ON purchase_orders
  FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "po_insert" ON purchase_orders
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "po_update" ON purchase_orders
  FOR UPDATE
  USING    (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ─── PURCHASE ORDER ITEMS ─────────────────────────────────────
CREATE POLICY "poi_select" ON purchase_order_items
  FOR SELECT USING (
    po_id IN (
      SELECT id FROM purchase_orders
      WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "poi_insert" ON purchase_order_items
  FOR INSERT WITH CHECK (
    po_id IN (
      SELECT id FROM purchase_orders
      WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "poi_update" ON purchase_order_items
  FOR UPDATE
  USING (
    po_id IN (
      SELECT id FROM purchase_orders
      WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ─── SUPPLIER PAYMENTS ────────────────────────────────────────
CREATE POLICY "sp_select" ON supplier_payments
  FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "sp_insert" ON supplier_payments
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- ─── Fix po_number (quitar default SERIAL, dejar el trigger) ──
ALTER TABLE purchase_orders ALTER COLUMN po_number DROP DEFAULT;
ALTER TABLE purchase_orders ALTER COLUMN po_number SET DEFAULT 0;

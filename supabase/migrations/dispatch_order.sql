-- ============================================================
-- Migración: Despacho Parcial de Órdenes
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Columna en sales_order_items para guardar la cantidad real despachada
ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS dispatched_quantity numeric DEFAULT NULL;

COMMENT ON COLUMN sales_order_items.dispatched_quantity IS
  'Cantidad real despachada por almacén. NULL = aún no despachada.';

-- ============================================================
-- 2. Función RPC: dispatch_order
--    Recibe una lista de ítems con sus cantidades despachadas,
--    ajusta el stock si se despacha menos de lo pedido,
--    y mueve la orden al estado "despachada".
-- ============================================================
CREATE OR REPLACE FUNCTION dispatch_order(
  p_order_id   uuid,
  p_items      jsonb,        -- [{item_id, dispatched_qty}]
  p_notes      text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_item        jsonb;
  v_item_id     uuid;
  v_disp_qty    numeric;
  v_orig_qty    numeric;
  v_product_id  uuid;
BEGIN
  -- Iterar cada ítem recibido
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id  := (v_item->>'item_id')::uuid;
    v_disp_qty := (v_item->>'dispatched_qty')::numeric;

    -- Obtener cantidad original y producto del ítem
    SELECT quantity, product_id
      INTO v_orig_qty, v_product_id
      FROM sales_order_items
     WHERE id = v_item_id
       AND order_id = p_order_id;

    -- Guardar la cantidad despachada en el ítem
    UPDATE sales_order_items
       SET dispatched_quantity = v_disp_qty
     WHERE id = v_item_id;

    -- Si se despacha menos, liberar la diferencia del stock reservado
    -- y devolverla al stock disponible
    IF v_disp_qty < v_orig_qty THEN
      UPDATE products
         SET stock_reserved = GREATEST(0, COALESCE(stock_reserved, 0) - (v_orig_qty - v_disp_qty)),
             stock          = COALESCE(stock, 0) + (v_orig_qty - v_disp_qty),
             updated_at     = now()
       WHERE id = v_product_id;
    END IF;
  END LOOP;

  -- Cambiar el estado de la orden a "despachada"
  -- Usa la función existente que también registra en order_status_log
  PERFORM update_order_status(p_order_id, 'despachada', p_notes, NULL);
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION dispatch_order(uuid, jsonb, text) TO authenticated;

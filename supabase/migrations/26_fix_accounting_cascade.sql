-- ============================================================
-- FIX: Actualizar RPC de eliminación para tablas de contabilidad
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION superadmin_delete_company(
  p_company_id     UUID,
  p_admin_email    TEXT,
  p_admin_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profiles_to_delete UUID[];
BEGIN
  -- Verificar que el caller es superadmin
  IF NOT (SELECT is_superadmin FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- 1. Guardar los IDs de los perfiles normales que pertenecen a la empresa
  SELECT array_agg(id) INTO v_profiles_to_delete
  FROM profiles
  WHERE company_id = p_company_id
    AND is_superadmin = FALSE;

  -- 2. Desligar a TODOS los perfiles de la empresa temporalmente
  -- (Esto incluye tanto a superadmins como a los normales para evitar 
  -- que PostgreSQL bloquee el borrado de la empresa si profiles no tiene CASCADE)
  UPDATE profiles
  SET company_id = NULL
  WHERE company_id = p_company_id;

  -- 3. Eliminar explícitamente tablas que sabemos que pueden no tener CASCADE o dar problemas
  -- Borrar contabilidad
  DELETE FROM journal_lines WHERE entry_id IN (SELECT id FROM journal_entries WHERE company_id = p_company_id);
  DELETE FROM journal_entries WHERE company_id = p_company_id;
  
  -- Borrar ventas y relacionados (esto elimina las references a profiles)
  DELETE FROM client_payments WHERE company_id = p_company_id;
  DELETE FROM invoices WHERE company_id = p_company_id;
  DELETE FROM sales_order_items WHERE order_id IN (SELECT id FROM sales_orders WHERE company_id = p_company_id);
  DELETE FROM sales_orders WHERE company_id = p_company_id;
  
  -- Borrar compras y movimientos
  DELETE FROM supplier_payments WHERE company_id = p_company_id;
  DELETE FROM purchase_order_items WHERE po_id IN (SELECT id FROM purchase_orders WHERE company_id = p_company_id);
  DELETE FROM purchase_orders WHERE company_id = p_company_id;
  DELETE FROM stock_movements WHERE company_id = p_company_id;
  
  -- 4. Eliminar la empresa
  -- Esto disparará los ON DELETE CASCADE de sales_orders, invoices, etc.
  -- Al borrarse esas tablas, desaparecen las llaves foráneas que apuntan a nuestros perfiles.
  DELETE FROM companies WHERE id = p_company_id;

  -- 5. Finalmente, eliminar los perfiles normales.
  -- Ahora no fallarán las foreign keys porque las tablas hijas ya fueron eliminadas.
  IF array_length(v_profiles_to_delete, 1) > 0 THEN
    DELETE FROM profiles WHERE id = ANY(v_profiles_to_delete);
  END IF;
END;
$$;

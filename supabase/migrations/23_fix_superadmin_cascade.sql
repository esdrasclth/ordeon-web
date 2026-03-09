-- ============================================================
-- FIX: Proteger el perfil del superadmin al eliminar empresa
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- 1. RESTAURAR TU PERFIL DE SUPERADMIN
--    (ejecuta primero SELECT para obtener tu UUID)
--
--    SELECT id, email FROM auth.users WHERE email = 'TU_EMAIL@AQUI';
--
--    Luego reemplaza el UUID abajo y ejecuta el INSERT:

-- INSERT INTO profiles (id, full_name, role, is_superadmin, company_id)
-- VALUES (
--   'PEGA-TU-UUID-AQUI',
--   'Super Admin',
--   'admin',
--   TRUE,
--   NULL
-- )
-- ON CONFLICT (id) DO UPDATE
--   SET is_superadmin = TRUE,
--       company_id    = NULL;


-- 2. ACTUALIZAR EL RPC para NO eliminar perfiles de superadmin
--    (previene que esto vuelva a ocurrir)

CREATE OR REPLACE FUNCTION superadmin_delete_company(
  p_company_id     UUID,
  p_admin_email    TEXT,
  p_admin_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el caller es superadmin
  IF NOT (SELECT is_superadmin FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Desligar (no eliminar) perfiles de superadmin que apunten a esta empresa
  UPDATE profiles
  SET company_id = NULL
  WHERE company_id = p_company_id
    AND is_superadmin = TRUE;

  -- Eliminar perfiles normales (los usuarios de la empresa, no superadmins)
  DELETE FROM profiles
  WHERE company_id = p_company_id
    AND is_superadmin = FALSE;

  -- Eliminar la empresa (cascada elimina el resto de datos de negocio)
  DELETE FROM companies WHERE id = p_company_id;
END;
$$;

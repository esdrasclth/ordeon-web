-- ============================================================
-- ONBOARDING — Ordeon ERP
-- Agrega columna onboarding_completed a profiles
-- ============================================================

-- Columna para rastrear si el admin ya completó el onboarding
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Los admins ya existentes no deberían ver el onboarding
-- (solo los nuevos que se creen desde ahora)
UPDATE profiles
SET onboarding_completed = TRUE
WHERE onboarding_completed IS FALSE OR onboarding_completed IS NULL;

-- Los nuevos admins creados por el superadmin comenzarán con FALSE
-- (el API create-user lo establece explícitamente)

-- ============================================================
-- SUPERADMIN ENHANCEMENTS — Ordeon ERP
-- Tablas: audit_logs, subscriptions
-- ============================================================

-- ─── AUDITORÍA ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,   -- 'create_company', 'toggle_module', 'toggle_company', etc.
  entity_type  TEXT,            -- 'company', 'user', 'module'
  entity_id    TEXT,
  details      JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_company_idx ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_idx    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);

-- Solo superadmins pueden leer logs; nadie puede borrarlos via API
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_superadmin_select" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = TRUE)
  );

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);  -- Inserts vienen de SECURITY DEFINER functions

-- ─── SUSCRIPCIONES POR EMPRESA ───────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL DEFAULT 'basico',
  status          TEXT NOT NULL DEFAULT 'activa'
                  CHECK (status IN ('activa','suspendida','cancelada','prueba')),
  amount_monthly  NUMERIC(10,2) DEFAULT 0,
  currency        TEXT DEFAULT 'HNL',
  billing_day     INT DEFAULT 1,           -- día del mes para cobro
  trial_ends_at   DATE,
  current_period_start DATE DEFAULT CURRENT_DATE,
  current_period_end   DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_company_idx ON subscriptions(company_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_superadmin" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = TRUE)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = TRUE)
  );

-- ─── PAGOS RECIBIDOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency        TEXT DEFAULT 'HNL',
  payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method  TEXT DEFAULT 'transferencia',
  reference       TEXT,
  period_start    DATE,
  period_end      DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS platform_payments_company_idx ON platform_payments(company_id);

ALTER TABLE platform_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_payments_superadmin" ON platform_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = TRUE)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = TRUE)
  );

-- ─── Auto-create subscriptions para empresas existentes ──────
INSERT INTO subscriptions (company_id, plan, status, amount_monthly)
SELECT id, COALESCE(plan, 'basico'), 'activa', 0
FROM companies
WHERE id NOT IN (SELECT company_id FROM subscriptions)
ON CONFLICT DO NOTHING;

-- ─── Trigger: nueva empresa crea suscripción automática ──────
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (company_id, plan, status, amount_monthly)
  VALUES (NEW.id, COALESCE(NEW.plan, 'basico'), 'activa', 0)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_subscription ON companies;
CREATE TRIGGER trg_create_subscription
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

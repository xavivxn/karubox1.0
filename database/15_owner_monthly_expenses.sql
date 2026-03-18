-- ============================================
-- Migration 15: Pagos mensuales fijos de owners
-- Permite registrar compromisos mensuales (BD, dominios, herramientas, etc.)
-- que se asumen siempre divididos 50/50 entre Naser e Ivan.
-- ============================================

CREATE TABLE IF NOT EXISTS owner_monthly_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concepto TEXT NOT NULL,
  monto NUMERIC(14,2) NOT NULL CHECK (monto > 0),
  fecha_inicio DATE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE owner_monthly_expenses IS 'Pagos mensuales fijos gestionados por owners (siempre 50/50 entre socios).';
COMMENT ON COLUMN owner_monthly_expenses.concepto IS 'Descripción del pago mensual (ej: BD Supabase, dominio, herramienta).';

CREATE INDEX IF NOT EXISTS idx_owner_monthly_expenses_activo
  ON owner_monthly_expenses(activo)
  WHERE activo = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON owner_monthly_expenses TO authenticated;
ALTER TABLE owner_monthly_expenses DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION set_owner_monthly_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_owner_monthly_expenses_updated_at ON owner_monthly_expenses;
CREATE TRIGGER trigger_owner_monthly_expenses_updated_at
  BEFORE UPDATE ON owner_monthly_expenses
  FOR EACH ROW EXECUTE FUNCTION set_owner_monthly_expenses_updated_at();


-- ============================================
-- Migration 14: Caja para owners (Karubox)
-- Registra inversiones, gastos, deudas y retiros de socios a nivel global
-- con soporte para resúmenes mensuales/anuales y reparto entre socios.
-- ============================================

CREATE TABLE IF NOT EXISTS owner_cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('inversion', 'gasto', 'pago_proveedor', 'retiro_socios', 'ajuste')),
  monto NUMERIC(14,2) NOT NULL CHECK (monto > 0),
  descripcion TEXT,
  categoria TEXT,
  socio TEXT CHECK (socio IN ('naser', 'ivan')) DEFAULT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  pagado BOOLEAN NOT NULL DEFAULT true,
  fecha_pago DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE owner_cash_movements IS 'Movimientos de caja de owners (Karubox): inversiones, gastos, pagos a proveedores y retiros de socios.';
COMMENT ON COLUMN owner_cash_movements.tipo IS 'inversion, gasto, pago_proveedor, retiro_socios, ajuste';
COMMENT ON COLUMN owner_cash_movements.socio IS 'Identifica a qué socio pertenece el movimiento cuando aplica (naser/ivan).';
COMMENT ON COLUMN owner_cash_movements.pagado IS 'Indica si el movimiento ya fue pagado (true) o sigue como deuda (false).';

CREATE INDEX IF NOT EXISTS idx_owner_cash_movements_fecha ON owner_cash_movements(fecha);
CREATE INDEX IF NOT EXISTS idx_owner_cash_movements_tenant ON owner_cash_movements(tenant_id, fecha);
CREATE INDEX IF NOT EXISTS idx_owner_cash_movements_tipo ON owner_cash_movements(tipo);
CREATE INDEX IF NOT EXISTS idx_owner_cash_movements_pagado ON owner_cash_movements(pagado);

-- Tabla opcional para snapshot de saldos por socio
CREATE TABLE IF NOT EXISTS owner_partner_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  socio TEXT NOT NULL CHECK (socio IN ('naser', 'ivan')),
  saldo_acumulado NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE owner_partner_balances IS 'Saldos acumulados por socio (snapshot rápido para panel de owners).';

-- Permisos básicos (se controlará por RLS/rol owner desde la app)
GRANT SELECT, INSERT, UPDATE, DELETE ON owner_cash_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON owner_partner_balances TO authenticated;

ALTER TABLE owner_cash_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE owner_partner_balances DISABLE ROW LEVEL SECURITY;

-- Trigger updated_at para owner_cash_movements
CREATE OR REPLACE FUNCTION set_owner_cash_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_owner_cash_movements_updated_at ON owner_cash_movements;
CREATE TRIGGER trigger_owner_cash_movements_updated_at
  BEFORE UPDATE ON owner_cash_movements
  FOR EACH ROW EXECUTE FUNCTION set_owner_cash_movements_updated_at();


-- ============================================
-- Migration 11: Sesiones de caja (apertura/cierre)
-- Permite "Empezar el día" y "Cerrar caja" por tenant
-- ============================================

CREATE TABLE IF NOT EXISTS sesiones_caja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  apertura_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cierre_at TIMESTAMPTZ,
  abierto_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  cerrado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  total_ventas NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_costo_estimado NUMERIC(14, 2) NOT NULL DEFAULT 0,
  monto_pagado_empleados NUMERIC(14, 2) NOT NULL DEFAULT 0,
  ganancia_neta NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cantidad_pedidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_cierre_consistente CHECK (cierre_at IS NULL OR (total_ventas >= 0 AND monto_pagado_empleados >= 0))
);

COMMENT ON TABLE sesiones_caja IS 'Sesiones de caja por tenant: apertura (Empezar el día) y cierre con totales';
COMMENT ON COLUMN sesiones_caja.cierre_at IS 'NULL = caja abierta; con valor = caja cerrada';
COMMENT ON COLUMN sesiones_caja.monto_pagado_empleados IS 'Monto pagado a empleados en el día (sueldos/adelantos) que se resta de ganancia';
COMMENT ON COLUMN sesiones_caja.ganancia_neta IS 'total_ventas - total_costo_estimado - monto_pagado_empleados';

CREATE INDEX IF NOT EXISTS idx_sesiones_caja_tenant ON sesiones_caja(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sesiones_caja_abierta ON sesiones_caja(tenant_id) WHERE cierre_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_cierre ON sesiones_caja(tenant_id, cierre_at DESC);

-- RLS: usuarios del mismo tenant pueden leer; insert/update se controla por app (solo admin)
ALTER TABLE sesiones_caja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios del tenant pueden leer sesiones de caja"
  ON sesiones_caja FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios
      WHERE auth.uid() = usuarios.auth_user_id AND usuarios.is_deleted = false
    )
  );

CREATE POLICY "Usuarios del tenant pueden insertar sesiones (admin en app)"
  ON sesiones_caja FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM usuarios
      WHERE auth.uid() = usuarios.auth_user_id AND usuarios.is_deleted = false
    )
  );

CREATE POLICY "Usuarios del tenant pueden actualizar sesiones (admin en app)"
  ON sesiones_caja FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios
      WHERE auth.uid() = usuarios.auth_user_id AND usuarios.is_deleted = false
    )
  );

-- Permisos para el rol authenticated (necesario para que RLS aplique)
GRANT SELECT, INSERT, UPDATE ON public.sesiones_caja TO authenticated;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_sesiones_caja_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sesiones_caja_updated_at ON sesiones_caja;
CREATE TRIGGER trigger_sesiones_caja_updated_at
  BEFORE UPDATE ON sesiones_caja
  FOR EACH ROW EXECUTE FUNCTION set_sesiones_caja_updated_at();

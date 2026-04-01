-- ============================================
-- Migration 19: Logros Cocina 3D (persistencia por tenant)
-- Estado completo en JSONB; RLS por tenant vía usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS cocina_achievement_store (
  tenant_id UUID NOT NULL PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  store JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cocina_achievement_store IS 'Estado de logros Cocina 3D por local (unlocks, historial por sesión, lifetimeStats)';

CREATE INDEX IF NOT EXISTS idx_cocina_achievement_updated ON cocina_achievement_store(updated_at DESC);

ALTER TABLE cocina_achievement_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios del tenant pueden leer logros cocina"
  ON cocina_achievement_store FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios
      WHERE auth.uid() = usuarios.auth_user_id AND usuarios.is_deleted = false
    )
  );

CREATE POLICY "Usuarios del tenant pueden insertar logros cocina"
  ON cocina_achievement_store FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM usuarios
      WHERE auth.uid() = usuarios.auth_user_id AND usuarios.is_deleted = false
    )
  );

CREATE POLICY "Usuarios del tenant pueden actualizar logros cocina"
  ON cocina_achievement_store FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios
      WHERE auth.uid() = usuarios.auth_user_id AND usuarios.is_deleted = false
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.cocina_achievement_store TO authenticated;

CREATE OR REPLACE FUNCTION set_cocina_achievement_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cocina_achievement_store_updated_at ON cocina_achievement_store;
CREATE TRIGGER trigger_cocina_achievement_store_updated_at
  BEFORE UPDATE ON cocina_achievement_store
  FOR EACH ROW EXECUTE FUNCTION set_cocina_achievement_store_updated_at();

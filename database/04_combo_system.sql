/**
 * Migración 04: Sistema de Combos
 * 
 * Descripción:
 * - Crea tabla combo_items para almacenar productos que componen un combo
 * - Permite crear combos (ej: Cheese Kids + Papas + Coca Cola)
 * - Cada combo es un producto con tiene_receta=false
 * 
 * Versión: 1.4
 * Fecha: 2026-01-11
 */

-- =====================================================
-- TABLA: combo_items
-- =====================================================
-- Almacena los productos que componen un combo
-- combo_id es el producto que ES el combo
-- producto_id es cada producto incluido en el combo

CREATE TABLE IF NOT EXISTS combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  combo_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_combo_items_tenant ON combo_items(tenant_id);
CREATE INDEX idx_combo_items_combo ON combo_items(combo_id);
CREATE INDEX idx_combo_items_producto ON combo_items(producto_id);

-- Crear función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_combo_items_updated_at ON combo_items;
CREATE TRIGGER update_combo_items_updated_at
  BEFORE UPDATE ON combo_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver combos de su tenant"
  ON combo_items FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "Los usuarios pueden crear combos en su tenant"
  ON combo_items FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "Los usuarios pueden actualizar combos de su tenant"
  ON combo_items FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "Los usuarios pueden eliminar combos de su tenant"
  ON combo_items FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Comentarios
COMMENT ON TABLE combo_items IS 'Productos que componen un combo';
COMMENT ON COLUMN combo_items.combo_id IS 'ID del producto que es el combo';
COMMENT ON COLUMN combo_items.producto_id IS 'ID del producto incluido en el combo';
COMMENT ON COLUMN combo_items.cantidad IS 'Cantidad de este producto en el combo';

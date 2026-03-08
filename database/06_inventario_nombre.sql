-- Agregar columnas nombre y tipo_inventario a la tabla inventario
-- para que items de inventario puedan existir sin un producto vinculado

ALTER TABLE inventario
ADD COLUMN IF NOT EXISTS nombre TEXT;

ALTER TABLE inventario
ADD COLUMN IF NOT EXISTS tipo_inventario TEXT
  CHECK (tipo_inventario IN ('discreto', 'fraccionable'))
  DEFAULT 'discreto';

-- Backfill: copiar nombres de productos existentes vinculados
UPDATE inventario i
SET nombre = p.nombre
FROM productos p
WHERE i.producto_id = p.id
  AND i.nombre IS NULL;

-- Index para consultar items sin producto vinculado
CREATE INDEX IF NOT EXISTS idx_inventario_sin_producto
  ON inventario(tenant_id)
  WHERE producto_id IS NULL;

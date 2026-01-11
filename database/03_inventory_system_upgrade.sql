-- ============================================
-- UPGRADE SISTEMA DE INVENTARIO v1.3
-- Fecha: 2026-01-10
-- ============================================
--
-- Este script actualiza el sistema de inventario para soportar:
-- ✅ Inventario DUAL: Ingredientes (materias primas) + Productos (comprados)
-- ✅ Tipos de ingredientes: discretos (unidades) y fraccionables (peso/volumen)
-- ✅ Tracking de customización por pedido (sin cebolla, doble bacon)
-- ✅ Descuento automático según tipo de producto (con/sin receta)
--
-- ORDEN DE EJECUCIÓN:
-- 1. Ejecutar este script (03_inventory_system_upgrade.sql)
-- 2. Ejecutar 03b_mark_products_without_recipe.sql (migración de datos)
--
-- ============================================

-- ============================================
-- 1. MODIFICAR TABLA INGREDIENTES
-- Agregar campos de inventario integrado
-- ============================================

-- Agregar tipo de inventario (discreto vs fraccionable)
ALTER TABLE ingredientes 
ADD COLUMN IF NOT EXISTS tipo_inventario TEXT 
  CHECK (tipo_inventario IN ('discreto', 'fraccionable')) 
  DEFAULT 'fraccionable';

COMMENT ON COLUMN ingredientes.tipo_inventario IS 
  'discreto: unidades enteras (pan, huevo, feta de queso), fraccionable: peso/volumen (carne, lechuga, salsa)';

-- Agregar stock actual
ALTER TABLE ingredientes 
ADD COLUMN IF NOT EXISTS stock_actual NUMERIC(10,2) 
  DEFAULT 0 
  CHECK (stock_actual >= 0);

COMMENT ON COLUMN ingredientes.stock_actual IS 
  'Stock disponible actual del ingrediente en su unidad base';

-- Agregar stock mínimo
ALTER TABLE ingredientes 
ADD COLUMN IF NOT EXISTS stock_minimo NUMERIC(10,2) 
  DEFAULT 0 
  CHECK (stock_minimo >= 0);

COMMENT ON COLUMN ingredientes.stock_minimo IS 
  'Nivel mínimo de stock para generar alerta de reabastecimiento';

-- Agregar control de stock
ALTER TABLE ingredientes 
ADD COLUMN IF NOT EXISTS controlar_stock BOOLEAN 
  DEFAULT true;

COMMENT ON COLUMN ingredientes.controlar_stock IS 
  'Si true, el sistema descuenta automáticamente al confirmar pedidos';

-- Crear índice para búsqueda de stock bajo
CREATE INDEX IF NOT EXISTS idx_ingredientes_stock_bajo 
  ON ingredientes(tenant_id, stock_actual, stock_minimo) 
  WHERE controlar_stock = true AND stock_actual <= stock_minimo;

COMMENT ON INDEX idx_ingredientes_stock_bajo IS 
  'Optimiza consulta de ingredientes con stock bajo para alertas';

-- ============================================
-- 2. MODIFICAR TABLA PRODUCTOS
-- Indicar si el producto tiene receta o no
-- ============================================

-- Agregar campo tiene_receta
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS tiene_receta BOOLEAN 
  DEFAULT true;

COMMENT ON COLUMN productos.tiene_receta IS 
  'true: producto fabricado con receta (hamburguesa), false: producto comprado listo (Coca Cola, cerveza)';

-- Crear índice para filtrar productos por tipo
CREATE INDEX IF NOT EXISTS idx_productos_tiene_receta 
  ON productos(tenant_id, tiene_receta) 
  WHERE is_deleted = false;

-- ============================================
-- 3. CREAR TABLA MOVIMIENTOS_INGREDIENTES
-- Historial de movimientos de stock de materias primas
-- ============================================

CREATE TABLE IF NOT EXISTS movimientos_ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ingrediente_id UUID NOT NULL REFERENCES ingredientes(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'inicial')),
  cantidad NUMERIC(10,2) NOT NULL,
  stock_anterior NUMERIC(10,2) NOT NULL,
  stock_nuevo NUMERIC(10,2) NOT NULL,
  motivo TEXT,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE movimientos_ingredientes IS 
  'Historial de movimientos de stock de ingredientes/materias primas por tenant';

COMMENT ON COLUMN movimientos_ingredientes.tipo IS 
  'entrada: compra/carga de stock, salida: consumo por venta, ajuste: corrección manual, inicial: carga inicial';

COMMENT ON COLUMN movimientos_ingredientes.pedido_id IS 
  'Referencia al pedido que generó el movimiento (solo para tipo=salida)';

COMMENT ON COLUMN movimientos_ingredientes.motivo IS 
  'Descripción del movimiento: "Venta pedido #123", "Compra proveedor", "Ajuste por inventario físico"';

-- Índices para movimientos_ingredientes
CREATE INDEX IF NOT EXISTS idx_mov_ingredientes_tenant 
  ON movimientos_ingredientes(tenant_id);

CREATE INDEX IF NOT EXISTS idx_mov_ingredientes_ingrediente 
  ON movimientos_ingredientes(ingrediente_id);

CREATE INDEX IF NOT EXISTS idx_mov_ingredientes_pedido 
  ON movimientos_ingredientes(pedido_id);

CREATE INDEX IF NOT EXISTS idx_mov_ingredientes_fecha 
  ON movimientos_ingredientes(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mov_ingredientes_tipo 
  ON movimientos_ingredientes(tenant_id, tipo, created_at DESC);

-- ============================================
-- 4. CREAR TABLA ITEMS_PEDIDO_CUSTOMIZACION
-- Tracking de modificaciones por item
-- ============================================

CREATE TABLE IF NOT EXISTS items_pedido_customizacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_pedido_id UUID NOT NULL REFERENCES items_pedido(id) ON DELETE CASCADE,
  ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('extra', 'removido', 'modificado')),
  cantidad_original NUMERIC(10,2),
  cantidad_ajustada NUMERIC(10,2),
  precio_extra NUMERIC(10,2) DEFAULT 0,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE items_pedido_customizacion IS 
  'Tracking de customización por item: extras agregados, ingredientes removidos, cantidades modificadas';

COMMENT ON COLUMN items_pedido_customizacion.tipo IS 
  'extra: ingrediente agregado (doble queso), removido: ingrediente quitado (sin cebolla), modificado: cantidad cambiada';

COMMENT ON COLUMN items_pedido_customizacion.cantidad_original IS 
  'Cantidad del ingrediente según la receta original del producto';

COMMENT ON COLUMN items_pedido_customizacion.cantidad_ajustada IS 
  'Cantidad ajustada después de la customización (0 si removido, doble si extra)';

COMMENT ON COLUMN items_pedido_customizacion.precio_extra IS 
  'Precio adicional cobrado por la customización (ej: doble bacon +2000 Gs)';

COMMENT ON COLUMN items_pedido_customizacion.motivo IS 
  'Descripción legible: "Sin cebolla", "Doble bacon", "Extra queso"';

-- Índices para items_pedido_customizacion
CREATE INDEX IF NOT EXISTS idx_items_custom_item 
  ON items_pedido_customizacion(item_pedido_id);

CREATE INDEX IF NOT EXISTS idx_items_custom_ingrediente 
  ON items_pedido_customizacion(ingrediente_id);

CREATE INDEX IF NOT EXISTS idx_items_custom_tipo 
  ON items_pedido_customizacion(item_pedido_id, tipo);

-- ============================================
-- 5. VISTA ÚTIL: INGREDIENTES CON STOCK BAJO
-- ============================================

DROP VIEW IF EXISTS vista_ingredientes_stock_bajo;
CREATE VIEW vista_ingredientes_stock_bajo AS
SELECT 
  i.id,
  i.tenant_id,
  t.nombre as tenant_nombre,
  i.nombre as ingrediente_nombre,
  i.tipo_inventario,
  i.stock_actual,
  i.stock_minimo,
  i.unidad,
  (i.stock_actual - i.stock_minimo) as diferencia,
  CASE 
    WHEN i.stock_actual = 0 THEN 'critico'
    WHEN i.stock_actual <= (i.stock_minimo * 0.5) THEN 'muy_bajo'
    WHEN i.stock_actual <= i.stock_minimo THEN 'bajo'
    ELSE 'normal'
  END as nivel_alerta
FROM ingredientes i
JOIN tenants t ON i.tenant_id = t.id AND t.is_deleted = false
WHERE i.controlar_stock = true
  AND i.activo = true
  AND i.stock_actual <= i.stock_minimo
ORDER BY 
  i.tenant_id, 
  (i.stock_actual - i.stock_minimo) ASC,
  i.nombre;

COMMENT ON VIEW vista_ingredientes_stock_bajo IS 
  'Ingredientes con stock bajo o crítico para generar alertas y órdenes de compra';

-- ============================================
-- 6. VISTA ÚTIL: CONSUMO DE INGREDIENTES POR PERÍODO
-- ============================================

DROP VIEW IF EXISTS vista_consumo_ingredientes;
CREATE VIEW vista_consumo_ingredientes AS
SELECT 
  i.tenant_id,
  i.id as ingrediente_id,
  i.nombre as ingrediente_nombre,
  i.unidad,
  DATE(mi.created_at) as fecha,
  COUNT(DISTINCT mi.pedido_id) as pedidos,
  SUM(CASE WHEN mi.tipo = 'salida' THEN mi.cantidad ELSE 0 END) as cantidad_consumida,
  SUM(CASE WHEN mi.tipo = 'entrada' THEN mi.cantidad ELSE 0 END) as cantidad_ingresada,
  AVG(CASE WHEN mi.tipo = 'salida' THEN mi.cantidad ELSE NULL END) as promedio_consumo_diario
FROM ingredientes i
LEFT JOIN movimientos_ingredientes mi ON i.id = mi.ingrediente_id
WHERE i.activo = true
GROUP BY i.tenant_id, i.id, i.nombre, i.unidad, DATE(mi.created_at)
ORDER BY i.tenant_id, DATE(mi.created_at) DESC, i.nombre;

COMMENT ON VIEW vista_consumo_ingredientes IS 
  'Estadísticas de consumo e ingreso de ingredientes por día para análisis y proyecciones';

-- ============================================
-- 7. FUNCIÓN: OBTENER STOCK ACTUAL DE INGREDIENTE
-- ============================================

CREATE OR REPLACE FUNCTION obtener_stock_ingrediente(p_ingrediente_id UUID)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_stock NUMERIC(10,2);
BEGIN
  SELECT stock_actual INTO v_stock
  FROM ingredientes
  WHERE id = p_ingrediente_id;
  
  RETURN COALESCE(v_stock, 0);
END;
$$;

COMMENT ON FUNCTION obtener_stock_ingrediente IS 
  'Retorna el stock actual de un ingrediente por su ID';

-- ============================================
-- 8. FUNCIÓN: VERIFICAR SI HAY STOCK SUFICIENTE
-- ============================================

CREATE OR REPLACE FUNCTION verificar_stock_ingrediente(
  p_ingrediente_id UUID,
  p_cantidad_requerida NUMERIC(10,2)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_stock_actual NUMERIC(10,2);
  v_controlar_stock BOOLEAN;
BEGIN
  SELECT stock_actual, controlar_stock 
  INTO v_stock_actual, v_controlar_stock
  FROM ingredientes
  WHERE id = p_ingrediente_id;
  
  -- Si no controla stock, siempre hay suficiente
  IF NOT v_controlar_stock THEN
    RETURN true;
  END IF;
  
  -- Verificar si hay stock suficiente
  RETURN (v_stock_actual >= p_cantidad_requerida);
END;
$$;

COMMENT ON FUNCTION verificar_stock_ingrediente IS 
  'Verifica si hay stock suficiente de un ingrediente para una cantidad requerida';

-- ============================================
-- 9. PERMISOS
-- ============================================

-- Permisos para movimientos_ingredientes
GRANT SELECT, INSERT, UPDATE, DELETE ON movimientos_ingredientes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON movimientos_ingredientes TO authenticated;

-- Permisos para items_pedido_customizacion
GRANT SELECT, INSERT, UPDATE, DELETE ON items_pedido_customizacion TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON items_pedido_customizacion TO authenticated;

-- Permisos para vistas
GRANT SELECT ON vista_ingredientes_stock_bajo TO anon;
GRANT SELECT ON vista_ingredientes_stock_bajo TO authenticated;
GRANT SELECT ON vista_consumo_ingredientes TO anon;
GRANT SELECT ON vista_consumo_ingredientes TO authenticated;

-- ============================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migración 03_inventory_system_upgrade.sql completada exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Cambios aplicados:';
  RAISE NOTICE '  ✅ ingredientes: agregados tipo_inventario, stock_actual, stock_minimo, controlar_stock';
  RAISE NOTICE '  ✅ productos: agregado tiene_receta';
  RAISE NOTICE '  ✅ Tabla movimientos_ingredientes creada';
  RAISE NOTICE '  ✅ Tabla items_pedido_customizacion creada';
  RAISE NOTICE '  ✅ Vistas y funciones auxiliares creadas';
  RAISE NOTICE '  ✅ Índices optimizados agregados';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Próximo paso: Ejecutar 03b_mark_products_without_recipe.sql';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '  - Los ingredientes existentes tienen stock_actual = 0 por defecto';
  RAISE NOTICE '  - Deberás cargar el stock inicial manualmente';
  RAISE NOTICE '  - Los productos existentes tienen tiene_receta = true por defecto';
  RAISE NOTICE '  - Deberás marcar las bebidas/extras con tiene_receta = false';
END $$;

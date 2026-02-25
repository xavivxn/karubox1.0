-- ============================================
-- MIGRACIÓN DE DATOS - INVENTARIO v1.3
-- Fecha: 2026-01-10
-- ============================================
--
-- Este script migra los datos existentes al nuevo sistema de inventario:
-- ✅ Marca productos sin receta (bebidas, extras)
-- ✅ Inicializa tipo_inventario según unidad
-- ✅ Configura stock inicial de ingredientes
--
-- PREREQUISITO: Ejecutar 03_inventory_system_upgrade.sql primero
--
-- ============================================

-- ============================================
-- 1. MARCAR PRODUCTOS SIN RECETA (ATLAS BURGER)
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_productos_actualizados INTEGER;
BEGIN
  -- Obtener ID del tenant Atlas Burger
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'atlas-burger';
  
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '⚠️  Tenant atlas-burger no encontrado. Saltando actualización de productos.';
  ELSE
    -- Marcar productos sin receta (productos comprados listos)
    UPDATE productos 
    SET tiene_receta = false
    WHERE tenant_id = v_tenant_id
    AND nombre IN (
      -- BEBIDAS (no se fabrican, se compran)
      'Coca Cola Personal',
      'Coca Cola 1/2',
      'Coca Cola Lata',
      'Coca Cola 1,5L',
      'Del Valle Jugo 200ml',
      'Del Valle Jugo 1.5LTS',
      
      -- EXTRAS/AGREGADOS (no son productos principales)
      'Salsa de Ajo',
      'Ketchup',
      'Papitas',
      'Barbacoa',
      'Cheddar Derretido',
      
      -- ENTRADAS SIN RECETA (si aplica, ajustar según negocio)
      'Nuggets'  -- Si los nuggets se compran congelados
    );
    
    GET DIAGNOSTICS v_productos_actualizados = ROW_COUNT;
    
    RAISE NOTICE '✅ Atlas Burger: % productos marcados como sin receta (tiene_receta=false)', v_productos_actualizados;
  END IF;
END $$;

-- ============================================
-- 2. INICIALIZAR TIPO_INVENTARIO DE INGREDIENTES
-- ============================================

DO $$
DECLARE
  v_ingredientes_actualizados INTEGER;
BEGIN
  -- Clasificar ingredientes según su unidad
  -- DISCRETOS: unidad (se cuentan por unidades enteras)
  UPDATE ingredientes
  SET tipo_inventario = 'discreto'
  WHERE unidad IN ('unidad', 'unidades', 'u', 'unit')
  AND tipo_inventario IS NULL;
  
  -- FRACCIONABLES: peso/volumen (se miden en gramos, ml, etc)
  UPDATE ingredientes
  SET tipo_inventario = 'fraccionable'
  WHERE unidad IN ('g', 'gr', 'gramo', 'gramos', 'kg', 'kilogramo', 'kilogramos',
                   'ml', 'mililitro', 'mililitros', 'l', 'litro', 'litros')
  AND tipo_inventario IS NULL;
  
  -- Por defecto: fraccionable para cualquier otro
  UPDATE ingredientes
  SET tipo_inventario = 'fraccionable'
  WHERE tipo_inventario IS NULL;
  
  GET DIAGNOSTICS v_ingredientes_actualizados = ROW_COUNT;
  
  RAISE NOTICE '✅ % ingredientes clasificados por tipo_inventario', v_ingredientes_actualizados;
END $$;

-- ============================================
-- 3. INICIALIZAR STOCK DE INGREDIENTES
-- ============================================

DO $$
DECLARE
  v_ingredientes_inicializados INTEGER;
BEGIN
  -- Inicializar stock_minimo desde stock_minimo_sugerido (si existe)
  UPDATE ingredientes
  SET stock_minimo = COALESCE(stock_minimo_sugerido, 0)
  WHERE stock_minimo = 0 OR stock_minimo IS NULL;
  
  -- Stock inicial para que los pedidos no fallen por "stock insuficiente"
  -- Discretos (unidad): 200 | Fraccionables (g/ml): 50000 (el admin puede ajustar después)
  UPDATE ingredientes
  SET stock_actual = 200
  WHERE (stock_actual IS NULL OR stock_actual = 0)
    AND tipo_inventario = 'discreto';
  UPDATE ingredientes
  SET stock_actual = 50000
  WHERE (stock_actual IS NULL OR stock_actual = 0)
    AND tipo_inventario = 'fraccionable';
  -- Si aún no tienen tipo_inventario (schema viejo), dejar en 0
  UPDATE ingredientes
  SET stock_actual = 0
  WHERE stock_actual IS NULL;
  
  -- Activar control de stock para todos
  UPDATE ingredientes
  SET controlar_stock = true
  WHERE controlar_stock IS NULL;
  
  GET DIAGNOSTICS v_ingredientes_inicializados = ROW_COUNT;
  
  RAISE NOTICE '✅ % ingredientes inicializados con valores por defecto', v_ingredientes_inicializados;
  RAISE NOTICE '✅ Stock inicial aplicado (discreto: 200, fraccionable: 50000). Ajustá desde admin si hace falta.';
END $$;

-- ============================================
-- 4. EJEMPLOS DE CARGA INICIAL DE STOCK (OPCIONAL)
-- ============================================

-- ⚠️ COMENTADO POR DEFECTO - Descomentar y ajustar según tu inventario real

-- DO $$
-- DECLARE
--   v_tenant_id UUID;
-- BEGIN
--   SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'atlas-burger';
--   
--   IF v_tenant_id IS NOT NULL THEN
--     -- Ejemplo: Cargar stock inicial de ingredientes discretos
--     UPDATE ingredientes 
--     SET stock_actual = CASE slug
--       WHEN 'pan-brioche' THEN 100      -- 100 panes
--       WHEN 'pan-smash' THEN 80         -- 80 panes
--       WHEN 'huevo' THEN 60             -- 60 huevos
--       WHEN 'feta-queso' THEN 50        -- 50 fetas
--       WHEN 'coca-personal' THEN 24     -- 24 botellas
--       WHEN 'coca-lata' THEN 24         -- 24 latas
--       ELSE stock_actual
--     END
--     WHERE tenant_id = v_tenant_id
--     AND tipo_inventario = 'discreto';
--     
--     -- Ejemplo: Cargar stock inicial de ingredientes fraccionables (en gramos/ml)
--     UPDATE ingredientes 
--     SET stock_actual = CASE slug
--       WHEN 'carne-premium' THEN 10000  -- 10 kg de carne
--       WHEN 'queso-cheddar' THEN 5000   -- 5 kg de queso
--       WHEN 'lechuga' THEN 3000         -- 3 kg de lechuga
--       WHEN 'tomate' THEN 2000          -- 2 kg de tomate
--       WHEN 'cebolla' THEN 2000         -- 2 kg de cebolla
--       WHEN 'bacon' THEN 1500           -- 1.5 kg de bacon
--       WHEN 'salsa-house' THEN 2000     -- 2 litros de salsa
--       WHEN 'mayo' THEN 1500            -- 1.5 litros de mayonesa
--       ELSE stock_actual
--     END
--     WHERE tenant_id = v_tenant_id
--     AND tipo_inventario = 'fraccionable';
--     
--     RAISE NOTICE '✅ Stock inicial cargado para Atlas Burger';
--   END IF;
-- END $$;

-- ============================================
-- 5. VERIFICACIÓN DE PRODUCTOS CON/SIN RECETA
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_con_receta INTEGER;
  v_sin_receta INTEGER;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'atlas-burger';
  
  IF v_tenant_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_con_receta
    FROM productos
    WHERE tenant_id = v_tenant_id 
    AND tiene_receta = true
    AND is_deleted = false;
    
    SELECT COUNT(*) INTO v_sin_receta
    FROM productos
    WHERE tenant_id = v_tenant_id 
    AND tiene_receta = false
    AND is_deleted = false;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMEN ATLAS BURGER:';
    RAISE NOTICE '  🍔 Productos CON receta (fabricados): %', v_con_receta;
    RAISE NOTICE '  🥤 Productos SIN receta (comprados): %', v_sin_receta;
  END IF;
END $$;

-- ============================================
-- 6. VERIFICACIÓN DE INGREDIENTES
-- ============================================

DO $$
DECLARE
  v_discretos INTEGER;
  v_fraccionables INTEGER;
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_discretos
  FROM ingredientes
  WHERE tipo_inventario = 'discreto'
  AND activo = true;
  
  SELECT COUNT(*) INTO v_fraccionables
  FROM ingredientes
  WHERE tipo_inventario = 'fraccionable'
  AND activo = true;
  
  v_total := v_discretos + v_fraccionables;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMEN INGREDIENTES:';
  RAISE NOTICE '  📦 Ingredientes DISCRETOS (unidades): %', v_discretos;
  RAISE NOTICE '  ⚖️  Ingredientes FRACCIONABLES (peso/volumen): %', v_fraccionables;
  RAISE NOTICE '  📋 TOTAL ingredientes activos: %', v_total;
END $$;

-- ============================================
-- 7. LISTADO DE PRODUCTOS SIN RECETA
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID;
  rec RECORD;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'atlas-burger';
  
  IF v_tenant_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRODUCTOS SIN RECETA (Atlas Burger):';
    RAISE NOTICE '─────────────────────────────────────────────';
    
    FOR rec IN (
      SELECT nombre, precio
      FROM productos
      WHERE tenant_id = v_tenant_id
      AND tiene_receta = false
      AND is_deleted = false
      ORDER BY nombre
    )
    LOOP
      RAISE NOTICE '  • % (% Gs)', rec.nombre, rec.precio;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '✅ Migración 03b completada exitosamente';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Próximos pasos:';
  RAISE NOTICE '  1. Revisar productos marcados sin receta';
  RAISE NOTICE '  2. (Opcional) Ajustar stock de ingredientes desde admin';
  RAISE NOTICE '  3. Cargar stock de productos sin receta (bebidas) en tabla inventario';
  RAISE NOTICE '  4. Actualizar seeds/atlas-burger.sql con nuevos campos';
  RAISE NOTICE '  5. Probar descuento automático desde POS';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Stock inicial ya aplicado en sección 3 (discreto: 200, fraccionable: 50000).';
END $$;

-- ============================================
-- 📝 NOTAS PARA OTROS TENANTS
-- ============================================
--
-- Para aplicar esta migración a otro tenant:
--
-- 1. Reemplazar 'atlas-burger' por el slug de tu tenant
-- 2. Ajustar lista de productos sin receta según tu menú
-- 3. Descomentar sección 4 y ajustar valores de stock inicial
-- 4. Ejecutar el script
--
-- Ejemplo para otro tenant:
--
-- UPDATE productos 
-- SET tiene_receta = false
-- WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mi-lomiteria')
-- AND nombre IN ('Coca Cola', 'Sprite', 'Fanta', ...);
--
-- ============================================

-- ============================================
-- TEMPLATE SEED - NUEVA LOMITERÍA
-- Copia este archivo y reemplaza los datos
-- ============================================

-- IMPORTANTE: Reemplaza estos valores:
-- - [NOMBRE_LOMITERIA] - Ejemplo: "Atlas Burger"
-- - [SLUG_LOMITERIA] - Ejemplo: "atlas-burger" (sin espacios, minúsculas, guiones)
-- - [DESCRIPCION_CATEGORIA] - Descripción de cada categoría
-- - [NOMBRE_PRODUCTO] - Nombre del producto
-- - [DESCRIPCION_PRODUCTO] - Descripción del producto
-- - [PRECIO] - Precio en Guaraníes (GS)

-- Paso 1: Crear o actualizar el tenant
INSERT INTO tenants (nombre, slug, direccion, telefono, email, activo) 
VALUES (
  '[NOMBRE_LOMITERIA]',           -- Ejemplo: 'Atlas Burger'
  '[SLUG_LOMITERIA]',             -- Ejemplo: 'atlas-burger'
  'Dirección del local',          -- Opcional
  '(XX) XXXX-XXXX',               -- Opcional
  'contacto@email.com',           -- Opcional
  true
)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  updated_at = NOW();

-- Paso 2: Cargar datos del tenant
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Obtener el ID del tenant
  SELECT id INTO v_tenant_id 
  FROM tenants 
  WHERE slug = '[SLUG_LOMITERIA]';
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el tenant con slug: [SLUG_LOMITERIA]';
  END IF;

  -- Paso 3: Eliminar datos antiguos (si es actualización)
  DELETE FROM productos WHERE tenant_id = v_tenant_id;
  DELETE FROM categorias WHERE tenant_id = v_tenant_id;

  -- Paso 4: Insertar categorías
  -- Reemplaza estas categorías con las reales de tu cliente
  INSERT INTO categorias (tenant_id, nombre, descripcion, orden, activa) VALUES
  (v_tenant_id, 'Categoría 1', '[DESCRIPCION_CATEGORIA]', 1, true),
  (v_tenant_id, 'Categoría 2', '[DESCRIPCION_CATEGORIA]', 2, true),
  (v_tenant_id, 'Categoría 3', '[DESCRIPCION_CATEGORIA]', 3, true);

  -- Paso 5: Insertar productos
  -- Reemplaza estos productos con los reales de tu cliente
  INSERT INTO productos (tenant_id, categoria_id, nombre, descripcion, precio, disponible) VALUES
  
  -- Productos de Categoría 1
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Categoría 1'), 
   '[NOMBRE_PRODUCTO]', '[DESCRIPCION_PRODUCTO]', [PRECIO], true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Categoría 1'), 
   '[NOMBRE_PRODUCTO]', '[DESCRIPCION_PRODUCTO]', [PRECIO], true),
  
  -- Productos de Categoría 2
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Categoría 2'), 
   '[NOMBRE_PRODUCTO]', '[DESCRIPCION_PRODUCTO]', [PRECIO], true);

  RAISE NOTICE '✅ [NOMBRE_LOMITERIA]: Datos insertados correctamente';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
END $$;

-- Verificar datos insertados
SELECT 
  c.nombre as categoria,
  COUNT(p.id) as cantidad_productos,
  SUM(p.precio) as suma_precios
FROM categorias c
LEFT JOIN productos p ON c.id = p.categoria_id
WHERE c.tenant_id = (SELECT id FROM tenants WHERE slug = '[SLUG_LOMITERIA]')
GROUP BY c.nombre
ORDER BY c.orden;

-- Mostrar todos los productos
SELECT 
  c.nombre as categoria,
  p.nombre as producto,
  p.descripcion,
  p.precio
FROM productos p
JOIN categorias c ON p.categoria_id = c.id
WHERE p.tenant_id = (SELECT id FROM tenants WHERE slug = '[SLUG_LOMITERIA]')
ORDER BY c.orden, p.nombre;

-- ============================================
-- ✅ INSTRUCCIONES
-- ============================================
-- 
-- 1. Reemplaza todos los [VALORES] con los datos reales
-- 2. Agrega más categorías y productos según necesites
-- 3. Ejecuta en Supabase SQL Editor
-- 4. Verifica que los datos se hayan cargado correctamente
-- 
-- IMPORTANTE: Los usuarios se crean por separado en Supabase Auth
-- ============================================


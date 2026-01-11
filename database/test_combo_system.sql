/**
 * Script de Prueba: Sistema de Combos
 * 
 * Propósito:
 * - Validar que la tabla combo_items funciona correctamente
 * - Probar creación de combos con productos existentes
 * - Verificar consultas y relaciones
 * 
 * Fecha: 2026-01-11
 */

-- =====================================================
-- PASO 1: Verificar productos existentes para el combo
-- =====================================================
SELECT 
  id,
  nombre,
  precio,
  tiene_receta,
  disponible
FROM productos
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
  AND is_deleted = false
  AND disponible = true
ORDER BY nombre;

-- =====================================================
-- PASO 2: Crear un combo de ejemplo
-- =====================================================
-- Combo: "Promo Kids" = Cheese Kids + Papas Kids + Coca Cola 350ml

-- Primero insertamos el producto combo
INSERT INTO productos (
  tenant_id,
  nombre,
  descripcion,
  precio,
  categoria_id,
  disponible,
  tiene_receta,
  is_deleted,
  imagen_url
)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'atlas-burger'),
  'Promo Kids',
  'Combo infantil: Cheese Kids + Papas Kids + Coca Cola 350ml',
  25000, -- Precio especial del combo
  (SELECT id FROM categorias WHERE nombre = 'Combos' LIMIT 1),
  true,
  false, -- Los combos NO tienen receta
  false,
  '🎁'
)
RETURNING id, nombre, precio, tiene_receta;

-- Guardar el ID del combo creado (copia el UUID que devuelve la query anterior)
-- Reemplaza 'COMBO_ID_AQUI' con el UUID real en los siguientes pasos

-- =====================================================
-- PASO 3: Agregar productos al combo
-- =====================================================
-- IMPORTANTE: Reemplaza los UUIDs con los IDs reales de tu base de datos

-- Agregar Cheese Kids al combo
INSERT INTO combo_items (
  tenant_id,
  combo_id,
  producto_id,
  cantidad
)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'atlas-burger'),
  'COMBO_ID_AQUI', -- Reemplazar con ID del combo creado
  (SELECT id FROM productos WHERE nombre = 'Cheese Kids' AND tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger') LIMIT 1),
  1
);

-- Agregar Papas Kids al combo
INSERT INTO combo_items (
  tenant_id,
  combo_id,
  producto_id,
  cantidad
)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'atlas-burger'),
  'COMBO_ID_AQUI', -- Reemplazar con ID del combo creado
  (SELECT id FROM productos WHERE nombre = 'Papas Chicas' AND tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger') LIMIT 1),
  1
);

-- Agregar Coca Cola 350ml al combo (2 unidades)
INSERT INTO combo_items (
  tenant_id,
  combo_id,
  producto_id,
  cantidad
)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'atlas-burger'),
  'COMBO_ID_AQUI', -- Reemplazar con ID del combo creado
  (SELECT id FROM productos WHERE nombre LIKE 'Coca Cola Lata' AND tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger') LIMIT 1),
  1
);

-- =====================================================
-- PASO 4: Consultar el combo con sus items
-- =====================================================
-- Ver el combo creado
SELECT 
  p.id,
  p.nombre AS combo_nombre,
  p.descripcion,
  p.precio AS precio_combo,
  p.tiene_receta,
  COUNT(ci.id) AS total_items
FROM productos p
LEFT JOIN combo_items ci ON p.id = ci.combo_id
WHERE p.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
  AND p.nombre = 'Promo Kids'
GROUP BY p.id, p.nombre, p.descripcion, p.precio, p.tiene_receta;

-- Ver los items del combo con detalles
SELECT 
  combo.nombre AS combo_nombre,
  combo.precio AS precio_combo,
  producto.nombre AS item_nombre,
  producto.precio AS precio_item,
  ci.cantidad,
  (producto.precio * ci.cantidad) AS subtotal_item,
  producto.tiene_receta
FROM combo_items ci
JOIN productos combo ON ci.combo_id = combo.id
JOIN productos producto ON ci.producto_id = producto.id
WHERE ci.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
  AND combo.nombre = 'Promo Kids'
ORDER BY producto.nombre;

-- =====================================================
-- PASO 5: Calcular suma de precios vs precio del combo
-- =====================================================
SELECT 
  combo.nombre AS combo_nombre,
  combo.precio AS precio_combo,
  SUM(producto.precio * ci.cantidad) AS suma_precios_individuales,
  combo.precio - SUM(producto.precio * ci.cantidad) AS descuento
FROM combo_items ci
JOIN productos combo ON ci.combo_id = combo.id
JOIN productos producto ON ci.producto_id = producto.id
WHERE ci.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
  AND combo.nombre = 'Promo Kids'
GROUP BY combo.id, combo.nombre, combo.precio;

-- =====================================================
-- PASO 6: Verificar integridad de datos
-- =====================================================
-- Verificar que todos los combos tienen al menos un item
SELECT 
  p.id,
  p.nombre,
  p.precio,
  COUNT(ci.id) AS items_count
FROM productos p
LEFT JOIN combo_items ci ON p.id = ci.combo_id
WHERE p.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
  AND p.tiene_receta = false
  AND p.is_deleted = false
GROUP BY p.id, p.nombre, p.precio
HAVING COUNT(ci.id) = 0;
-- Si devuelve registros, son productos sin receta que NO son combos (están en inventario)

-- =====================================================
-- PASO 7: Consulta completa de todos los combos
-- =====================================================
WITH combo_details AS (
  SELECT 
    ci.combo_id,
    COUNT(*) AS total_items,
    SUM(p.precio * ci.cantidad) AS suma_precios,
    string_agg(
      p.nombre || ' (x' || ci.cantidad || ')', 
      ', ' 
      ORDER BY p.nombre
    ) AS items_list
  FROM combo_items ci
  JOIN productos p ON ci.producto_id = p.id
  WHERE ci.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
  GROUP BY ci.combo_id
)
SELECT 
  combo.nombre AS combo,
  combo.precio AS precio_combo,
  cd.suma_precios AS precio_individual,
  combo.precio - cd.suma_precios AS ahorro,
  cd.total_items AS items,
  cd.items_list AS contenido
FROM productos combo
JOIN combo_details cd ON combo.id = cd.combo_id
WHERE combo.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
ORDER BY combo.nombre;

-- =====================================================
-- PASO 8: Cleanup (opcional - solo si quieres borrar el combo de prueba)
-- =====================================================
/*
-- Descomentar para eliminar el combo de prueba

-- Eliminar items del combo
DELETE FROM combo_items 
WHERE combo_id = 'COMBO_ID_AQUI';

-- Eliminar el combo
DELETE FROM productos 
WHERE id = 'COMBO_ID_AQUI';
*/

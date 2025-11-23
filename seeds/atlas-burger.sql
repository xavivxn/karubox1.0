-- ============================================
-- ATLAS BURGER - DATOS REALES DEL MENÚ
-- Actualiza el tenant "Lomitería Don Juan" a "Atlas Burger"
-- ============================================

-- Paso 1: Actualizar el nombre del tenant
UPDATE tenants 
SET 
  nombre = 'Atlas Burger',
  slug = 'atlas-burger',
  updated_at = NOW()
WHERE slug = 'lomiteria-don-juan';

-- Paso 2: Obtener el ID del tenant Atlas Burger
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'atlas-burger';
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el tenant atlas-burger';
  END IF;

  -- Paso 3: Eliminar productos y categorías existentes
  DELETE FROM productos WHERE tenant_id = v_tenant_id;
  DELETE FROM categorias WHERE tenant_id = v_tenant_id;

  -- Paso 4: Insertar categorías de Atlas Burger
  INSERT INTO categorias (tenant_id, nombre, descripcion, orden, activa) VALUES
  (v_tenant_id, 'Burger Atlas', 'Hamburguesas Atlas', 1, true),
  (v_tenant_id, 'Smash Atlas', 'Hamburguesas Smash', 2, true),
  (v_tenant_id, 'Entradas', 'Acompañamientos y entradas', 3, true),
  (v_tenant_id, 'Árabes', 'Sándwiches árabes', 4, true),
  (v_tenant_id, 'Bebidas', 'Bebidas frías', 5, true),
  (v_tenant_id, 'Agregados', 'Extras y aderezos', 6, true);

  -- Paso 5: Insertar productos de Burger Atlas
  INSERT INTO productos (tenant_id, categoria_id, nombre, descripcion, precio, disponible) VALUES
  
  -- BURGER ATLAS
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Cheese Kids', 'Pan, Carne, queso cheddar', 17000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Clásica', 'Pan, aderezo, carne premium, lechuga, cebolla, queso cheddar', 20000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Mega de Luxe', 'Pan, aderezo, carne premium, lechuga, cebolla, queso cheddar, Jamón', 23000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Mega BBQ', 'Pan, salsa barbacoa, carne premium, lechuga, cebolla, queso cheddar, bacon', 23000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Mega Onion', 'Pan, aderezo, carne premium, lechuga, cebolla salteada, pepinillos, queso cheddar, bacon', 23000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Mega Bacon', 'Pan, aderezo, carne premium, lechuga, cebolla, queso cheddar, doble bacon', 23000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Burcheddar', 'Pan, aderezo, carne premium, lechuga, cebolla, queso cheddar, bacon. Cheddar cremoso por encima del pan + bacon picado', 27000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Big Atlas Doble Libra', 'Pan, aderezo, cebolla, doble carne premium, doble queso cheddar', 27000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Big Atlas', 'Pan, aderezo, doble carne premium, cebolla, lechuga, doble queso cheddar, doble bacon', 30000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Yaguamboom', 'Exclusivo Patronales de Yaguarón. Bro, pan brioche, aderezo, lechuga, tomate, huevo, carne premium, cheddar, panceta', 25000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Resacona', 'La resacona exclusivo de los días domingo. Pan, salsa picante, carne premium, cebolla morada, lechuga repolla, queso cheddar, bacon', 25000, true),

  -- SMASH ATLAS
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Smash Atlas'), 
   'Smash Atlas', 'Pan, aderezo, doble carne smash, cebolla, doble queso cheddar', 20000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Smash Atlas'), 
   'Smash Bacon', 'Pan, aderezo, doble carne smash, cebolla, doble queso cheddar, bacon', 23000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Smash Atlas'), 
   'Smash American Cuádruple', 'Pan, salsa atlas, lechuga Repollada, pepinillos, cuádruple, cuádruple carne Smash, cheddar', 32000, true),

  -- ENTRADAS
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Papas Pequeñas', 'Porción pequeña de papas fritas', 8000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Papas Medianas', 'Porción mediana de papas fritas', 10000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Papas Grandes', 'Porción grande de papas fritas', 12000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Nuggets', 'Nuggets de pollo', 12000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Agregado de Cheddar y Bacon', 'Agregado de cheddar y bacon para papas', 2000, true),

  -- ÁRABES
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Árabes'), 
   'Árabe Pollo', 'Pan árabe, cebolla, lechuga, repollo, salsa de ajo, pollo', 22000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Árabes'), 
   'Árabe Mixto', 'Pan árabe, cebolla, lechuga, repollo, salsa de ajo, pollo, carne', 22000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Árabes'), 
   'Árabe de Carne', 'Pan árabe, cebolla, lechuga, repollo, salsa de ajo, huevo, carne', 25000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Árabes'), 
   'Árabe XXL', 'Pan árabe, cebolla, lechuga, repollo, salsa de ajo, carne premium, pollo, jamón, cheddar, bacon', 30000, true),

  -- BEBIDAS
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Coca Cola Personal', 'Coca Cola tamaño personal', 5000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Coca Cola ½', 'Coca Cola media litro', 8000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Coca Cola Lata', 'Coca Cola en lata', 8000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Coca Cola 1,5L', 'Coca Cola botella 1.5 litros', 15000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Del Valle Jugo 200ml', 'Jugo Del Valle 200ml', 5000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Del Valle Jugo 1.5LTS', 'Jugo Del Valle 1.5 litros', 15000, true),

  -- AGREGADOS
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Agregados'), 
   'Salsa de Ajo', 'Salsa de ajo (sin costo)', 0, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Agregados'), 
   'Ketchup', 'Ketchup (sin costo)', 0, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Agregados'), 
   'Papitas', 'Papitas (sin costo)', 0, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Agregados'), 
   'Barbacoa', 'Salsa barbacoa', 2000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Agregados'), 
   'Cheddar Derretido', 'Cheddar derretido', 3000, true);

  RAISE NOTICE '✅ Atlas Burger: Datos insertados correctamente';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
END $$;

-- Verificar datos insertados
SELECT 
  c.nombre as categoria,
  COUNT(p.id) as cantidad_productos,
  SUM(p.precio) as suma_precios
FROM categorias c
LEFT JOIN productos p ON c.id = p.categoria_id
WHERE c.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
GROUP BY c.nombre, c.orden
ORDER BY c.orden;

-- Mostrar todos los productos
SELECT 
  c.nombre as categoria,
  p.nombre as producto,
  p.descripcion,
  p.precio
FROM productos p
JOIN categorias c ON p.categoria_id = c.id
WHERE p.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
ORDER BY c.orden, p.nombre;

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================
-- 
-- Este script:
-- 1. ✅ Actualiza el tenant "Lomitería Don Juan" a "Atlas Burger"
-- 2. ✅ Elimina productos y categorías antiguas
-- 3. ✅ Inserta todas las categorías del menú real
-- 4. ✅ Inserta todos los productos con precios en Guaraníes (GS)
-- 5. ✅ Mantiene el usuario existente vinculado
--
-- IMPORTANTE: El usuario de login existente sigue funcionando
-- Solo cambió el nombre del tenant y los productos
-- ============================================


-- ============================================
-- ATLAS BURGER - DATOS REALES DEL MENU
-- Actualiza el tenant "Lomiteria Don Juan" a "Atlas Burger"
-- ============================================

-- Paso 1: Crear o actualizar el tenant Atlas Burger
DO $$
DECLARE
  v_tenant_id UUID;
  v_tenant_exists BOOLEAN;
  -- Variables para configuración de impresora
  -- NOTA: Con Supabase Realtime, NO se necesitan túneles
  -- El agente se conecta directamente a Supabase y escucha cambios
  -- Estos valores son solo para referencia (no se usan con Realtime)
  v_agent_ip TEXT := 'localhost';  -- No se usa con Realtime, pero se mantiene para compatibilidad
  v_agent_port INTEGER := 3001;  -- No se usa con Realtime, pero se mantiene para compatibilidad
  v_printer_id TEXT := 'atlas-burger-printer-1';
BEGIN
  -- Verificar si el tenant atlas-burger ya existe
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'atlas-burger';
  v_tenant_exists := (v_tenant_id IS NOT NULL);
  
  IF v_tenant_exists THEN
    -- Si existe, solo actualizar nombre y datos
    UPDATE tenants 
    SET 
      nombre = 'Atlas Burger',
      updated_at = NOW()
    WHERE id = v_tenant_id;
    
    -- Actualizar RUC si la columna existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name = 'ruc'
    ) THEN
      UPDATE tenants 
      SET ruc = NULL -- TODO: Agregar RUC real de Atlas Burger
      WHERE id = v_tenant_id;
    END IF;
  ELSE
    -- Si no existe atlas-burger, intentar actualizar desde lomiteria-don-juan
    -- PERO primero verificar que atlas-burger no exista (por si acaso)
    SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'atlas-burger';
    
    IF v_tenant_id IS NULL THEN
      -- Solo actualizar si atlas-burger realmente no existe
      -- Usar subquery para verificar que no exista antes de actualizar
      UPDATE tenants 
      SET 
        nombre = 'Atlas Burger',
        slug = 'atlas-burger',
        updated_at = NOW()
      WHERE slug = 'lomiteria-don-juan'
        AND NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'atlas-burger');
      
      SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'atlas-burger';
      
      -- Si tampoco existe lomiteria-don-juan, crear nuevo tenant
      IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (nombre, slug, telefono, email, activo)
        VALUES ('Atlas Burger', 'atlas-burger', NULL, NULL, true)
        ON CONFLICT (slug) DO UPDATE SET nombre = 'Atlas Burger', updated_at = NOW()
        RETURNING id INTO v_tenant_id;
        
        -- Si hubo conflicto, obtener el tenant existente
        IF v_tenant_id IS NULL THEN
          SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'atlas-burger';
        END IF;
      END IF;
    END IF;
  END IF;

  -- Paso 3: Eliminar productos y categorias existentes
  DELETE FROM productos WHERE tenant_id = v_tenant_id;
  DELETE FROM categorias WHERE tenant_id = v_tenant_id;
  
  -- Paso 3.1: Limpiar empleados existentes (opcional, comentado para mantener datos)
  -- DELETE FROM empleados WHERE tenant_id = v_tenant_id;

  -- Paso 4: Insertar categorias de Atlas Burger
  INSERT INTO categorias (tenant_id, nombre, descripcion, orden, activa) VALUES
  (v_tenant_id, 'Burger Atlas', 'Hamburguesas Atlas', 1, true),
  (v_tenant_id, 'Smash Atlas', 'Hamburguesas Smash', 2, true),
  (v_tenant_id, 'Entradas', 'Acompañamientos y entradas', 3, true),
  (v_tenant_id, 'Arabes', 'Sandwiches arabes', 4, true),
  (v_tenant_id, 'Bebidas', 'Bebidas frias', 5, true),
  (v_tenant_id, 'Agregados', 'Extras y aderezos', 6, true);

  -- Paso 5: Insertar productos de Burger Atlas
  INSERT INTO productos (tenant_id, categoria_id, nombre, descripcion, precio, disponible) VALUES
  
  -- BURGER ATLAS
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Cheese Kids', 'Pan, Carne, queso cheddar', 17000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Clasica', 'Pan, aderezo, carne premium, lechuga, cebolla, queso cheddar', 20000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Mega de Luxe', 'Pan, aderezo, carne premium, lechuga, cebolla, queso cheddar, Jamon', 23000, true),
  
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
   'Yaguamboom', 'Exclusivo Patronales de Yaguaron. Bro, pan brioche, aderezo, lechuga, tomate, huevo, carne premium, cheddar, panceta', 25000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Burger Atlas'), 
   'Resacona', 'La resacona exclusivo de los dias domingo. Pan, salsa picante, carne premium, cebolla morada, lechuga repolla, queso cheddar, bacon', 25000, true),

  -- SMASH ATLAS
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Smash Atlas'), 
   'Smash Atlas', 'Pan, aderezo, doble carne smash, cebolla, doble queso cheddar', 20000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Smash Atlas'), 
   'Smash Bacon', 'Pan, aderezo, doble carne smash, cebolla, doble queso cheddar, bacon', 23000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Smash Atlas'), 
   'Smash American Cuadruple', 'Pan, salsa atlas, lechuga Repollada, pepinillos, cuadruple, cuadruple carne Smash, cheddar', 32000, true),

  -- ENTRADAS
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Papas Chicas', 'Porcion chica de papas fritas', 8000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Papas Medianas', 'Porcion mediana de papas fritas', 10000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Papas Grandes', 'Porcion grande de papas fritas', 12000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Nuggets', 'Nuggets de pollo', 12000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Entradas'), 
   'Agregado de Cheddar y Bacon', 'Agregado de cheddar y bacon para papas', 2000, true),

  -- ARABES
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Arabes'), 
   'Arabe Pollo', 'Pan arabe, cebolla, lechuga, repollo, salsa de ajo, pollo', 22000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Arabes'), 
   'Arabe Mixto', 'Pan arabe, cebolla, lechuga, repollo, salsa de ajo, pollo, carne', 22000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Arabes'), 
   'Arabe de Carne', 'Pan arabe, cebolla, lechuga, repollo, salsa de ajo, huevo, carne', 25000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Arabes'), 
   'Arabe XXL', 'Pan arabe, cebolla, lechuga, repollo, salsa de ajo, carne premium, pollo, jamon, cheddar, bacon', 30000, true),

  -- BEBIDAS
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Coca Cola Personal', 'Coca Cola tamaño personal', 5000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Coca Cola 1/2', 'Coca Cola media litro', 8000, true),
  
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

  -- Paso 6: Ingredientes base y recetas
  DELETE FROM recetas_producto WHERE tenant_id = v_tenant_id;
  DELETE FROM ingredientes WHERE tenant_id = v_tenant_id;

  INSERT INTO ingredientes (tenant_id, slug, nombre, unidad, icono, precio_publico, stock_minimo_sugerido, descripcion, activo)
  VALUES
    (v_tenant_id, 'pan-brioche', 'Pan Brioche Atlas', 'unidad', '🥖', 4000, 40, 'Panes para burgers premium', true),
    (v_tenant_id, 'pan-smash', 'Pan Smash', 'unidad', '🍞', 3000, 60, 'Panes chicos para smash burgers', true),
    (v_tenant_id, 'carne-120', 'Blend 120g', 'g', '🥩', 9000, 6000, 'Carne preparada para burgers clasicas', true),
    (v_tenant_id, 'carne-160', 'Blend 160g', 'g', '🍔', 11000, 8000, 'Carne premium para burgers especiales', true),
    (v_tenant_id, 'carne-90', 'Blend Smash 90g', 'g', '🍖', 7500, 5000, 'Carne para smash burgers', true),
    (v_tenant_id, 'cheddar', 'Queso Cheddar Bloque', 'g', '🧀', 3500, 3000, 'Bloques de cheddar para rallar', true),
    (v_tenant_id, 'bacon', 'Bacon Premium', 'g', '🥓', 4000, 2000, 'Bacon ahumado premium', true),
    (v_tenant_id, 'huevo', 'Huevos', 'unidad', '🥚', 2500, 60, 'Huevos frescos para toppings', true),
    (v_tenant_id, 'mix-verde', 'Mix Verde', 'g', '🥬', 1500, 1500, 'Lechuga, rucula y espinaca frescas', true),
    (v_tenant_id, 'tomate', 'Tomate Laminado', 'g', '🍅', 1800, 1200, 'Tomates frescos laminados', true),
    (v_tenant_id, 'cebolla', 'Cebolla Picada', 'g', '🧅', 1200, 1000, 'Cebolla fresca picada', true),
    (v_tenant_id, 'salsa-house', 'Salsa House', 'ml', '🥣', 1200, 1500, 'Salsa especial de la casa', true),
    (v_tenant_id, 'salsa-smash', 'Salsa Smash', 'ml', '🔥', 1200, 1200, 'Salsa para smash burgers', true),
    (v_tenant_id, 'salsa-garlic', 'Salsa de Ajo', 'ml', '🧄', 1500, 1000, 'Salsa de ajo casera', true),
    (v_tenant_id, 'papa-frita', 'Papa Pre-frita', 'g', '🍟', 3000, 8000, 'Papas congeladas listas para freir', true),
    (v_tenant_id, 'aceite', 'Aceite de Fritura', 'ml', '🛢️', 1000, 5000, 'Aceite alto rendimiento para freidoras', true),
    (v_tenant_id, 'sal', 'Sal Especial', 'g', '🧂', 800, 500, 'Sal con mezcla de especias', true),
    (v_tenant_id, 'nugget', 'Nugget Congelado', 'unidad', '🍗', 2500, 100, 'Nuggets de pollo congelados', true),
    (v_tenant_id, 'pan-arabe', 'Pan Arabe', 'unidad', '🥙', 4500, 40, 'Pan arabe artesanal', true),
    (v_tenant_id, 'pollo-mechado', 'Pollo Mechado', 'g', '🍗', 6500, 3000, 'Pollo desmenuzado para rellenos', true),
    (v_tenant_id, 'coca-15', 'Coca Cola 1.5L', 'unidad', '🥤', 15000, 12, 'Gaseosa Coca Cola 1.5 litros', true);

  -- Recetas Clasica
  INSERT INTO recetas_producto (tenant_id, producto_id, ingrediente_id, cantidad, unidad)
  SELECT
    v_tenant_id,
    (SELECT id FROM productos WHERE tenant_id = v_tenant_id AND nombre = 'Clasica'),
    ing.id,
    data.cantidad,
    data.unidad
  FROM (VALUES
    ('pan-brioche', 1, 'unidad'),
    ('carne-120', 120, 'g'),
    ('cheddar', 30, 'g'),
    ('mix-verde', 15, 'g'),
    ('tomate', 20, 'g')
  ) AS data(slug, cantidad, unidad)
  JOIN ingredientes ing ON ing.tenant_id = v_tenant_id AND ing.slug = data.slug;

  -- Recetas Mega Bacon
  INSERT INTO recetas_producto (tenant_id, producto_id, ingrediente_id, cantidad, unidad)
  SELECT
    v_tenant_id,
    (SELECT id FROM productos WHERE tenant_id = v_tenant_id AND nombre = 'Mega Bacon'),
    ing.id,
    data.cantidad,
    data.unidad
  FROM (VALUES
    ('pan-brioche', 1, 'unidad'),
    ('carne-160', 160, 'g'),
    ('cheddar', 40, 'g'),
    ('bacon', 35, 'g'),
    ('salsa-house', 20, 'ml')
  ) AS data(slug, cantidad, unidad)
  JOIN ingredientes ing ON ing.tenant_id = v_tenant_id AND ing.slug = data.slug;

  -- Recetas Big Atlas
  INSERT INTO recetas_producto (tenant_id, producto_id, ingrediente_id, cantidad, unidad)
  SELECT
    v_tenant_id,
    (SELECT id FROM productos WHERE tenant_id = v_tenant_id AND nombre = 'Big Atlas'),
    ing.id,
    data.cantidad,
    data.unidad
  FROM (VALUES
    ('pan-brioche', 1, 'unidad'),
    ('carne-160', 320, 'g'),
    ('cheddar', 50, 'g'),
    ('huevo', 1, 'unidad'),
    ('mix-verde', 20, 'g')
  ) AS data(slug, cantidad, unidad)
  JOIN ingredientes ing ON ing.tenant_id = v_tenant_id AND ing.slug = data.slug;

  -- Recetas Smash Atlas
  INSERT INTO recetas_producto (tenant_id, producto_id, ingrediente_id, cantidad, unidad)
  SELECT
    v_tenant_id,
    (SELECT id FROM productos WHERE tenant_id = v_tenant_id AND nombre = 'Smash Atlas'),
    ing.id,
    data.cantidad,
    data.unidad
  FROM (VALUES
    ('pan-smash', 1, 'unidad'),
    ('carne-90', 90, 'g'),
    ('cheddar', 25, 'g'),
    ('cebolla', 15, 'g'),
    ('salsa-smash', 15, 'ml')
  ) AS data(slug, cantidad, unidad)
  JOIN ingredientes ing ON ing.tenant_id = v_tenant_id AND ing.slug = data.slug;

  -- Recetas Papas Grandes
  INSERT INTO recetas_producto (tenant_id, producto_id, ingrediente_id, cantidad, unidad)
  SELECT
    v_tenant_id,
    (SELECT id FROM productos WHERE tenant_id = v_tenant_id AND nombre = 'Papas Grandes'),
    ing.id,
    data.cantidad,
    data.unidad
  FROM (VALUES
    ('papa-frita', 300, 'g'),
    ('aceite', 40, 'ml'),
    ('sal', 3, 'g')
  ) AS data(slug, cantidad, unidad)
  JOIN ingredientes ing ON ing.tenant_id = v_tenant_id AND ing.slug = data.slug;

  -- Recetas Nuggets
  INSERT INTO recetas_producto (tenant_id, producto_id, ingrediente_id, cantidad, unidad)
  SELECT
    v_tenant_id,
    (SELECT id FROM productos WHERE tenant_id = v_tenant_id AND nombre = 'Nuggets'),
    ing.id,
    data.cantidad,
    data.unidad
  FROM (VALUES
    ('nugget', 6, 'unidad'),
    ('aceite', 30, 'ml'),
    ('salsa-house', 15, 'ml')
  ) AS data(slug, cantidad, unidad)
  JOIN ingredientes ing ON ing.tenant_id = v_tenant_id AND ing.slug = data.slug;

  -- Recetas Arabe Pollo
  INSERT INTO recetas_producto (tenant_id, producto_id, ingrediente_id, cantidad, unidad)
  SELECT
    v_tenant_id,
    (SELECT id FROM productos WHERE tenant_id = v_tenant_id AND nombre = 'Arabe Pollo'),
    ing.id,
    data.cantidad,
    data.unidad
  FROM (VALUES
    ('pan-arabe', 1, 'unidad'),
    ('pollo-mechado', 140, 'g'),
    ('mix-verde', 25, 'g'),
    ('salsa-garlic', 20, 'ml')
  ) AS data(slug, cantidad, unidad)
  JOIN ingredientes ing ON ing.tenant_id = v_tenant_id AND ing.slug = data.slug;

  -- Recetas Coca Cola 1,5L
  INSERT INTO recetas_producto (tenant_id, producto_id, ingrediente_id, cantidad, unidad)
  SELECT
    v_tenant_id,
    (SELECT id FROM productos WHERE tenant_id = v_tenant_id AND nombre = 'Coca Cola 1,5L'),
    ing.id,
    1,
    'unidad'
  FROM ingredientes ing
  WHERE ing.tenant_id = v_tenant_id
    AND ing.slug = 'coca-15';

  -- Paso 7: Insertar empleados de ejemplo (cajeros para app movil)
  -- NOTA: Estos son empleados de ejemplo. Ajustar con datos reales.
  -- Si ya existen empleados, se insertaran duplicados. Para evitarlo, descomentar la linea DELETE de arriba.
  INSERT INTO empleados (tenant_id, nombre, ci, telefono, email, rol, activo)
  SELECT v_tenant_id, 'Juan Perez', '1234567', '+595981234567', 'juan.perez@atlasburger.com', 'cajero', true
  WHERE NOT EXISTS (SELECT 1 FROM empleados WHERE tenant_id = v_tenant_id AND ci = '1234567');
  
  INSERT INTO empleados (tenant_id, nombre, ci, telefono, email, rol, activo)
  SELECT v_tenant_id, 'Maria Gonzalez', '7654321', '+595981234568', 'maria.gonzalez@atlasburger.com', 'cajero', true
  WHERE NOT EXISTS (SELECT 1 FROM empleados WHERE tenant_id = v_tenant_id AND ci = '7654321');
  
  INSERT INTO empleados (tenant_id, nombre, ci, telefono, email, rol, activo)
  SELECT v_tenant_id, 'Carlos Rodriguez', '1122334', '+595981234569', NULL, 'repartidor', true
  WHERE NOT EXISTS (SELECT 1 FROM empleados WHERE tenant_id = v_tenant_id AND ci = '1122334');

  -- Paso 8: Configurar impresora para Atlas Burger
  -- CONFIGURACION PARA SUPABASE REALTIME (SIN TUNELES)
  -- 
  -- Con Supabase Realtime, el agente escucha cambios directamente en la tabla pedidos.
  -- Cuando estado_pedido = 'FACT' (facturado/confirmado), imprime automaticamente.
  -- 
  -- Flujo:
  -- 1. Vendedor confirma pedido - estado_pedido = 'FACT' en tabla pedidos
  -- 2. Supabase Realtime notifica al agente (WebSocket en tiempo real)
  -- 3. Agente consulta printer_config por lomiteria_id (tenant_id)
  -- 4. Agente obtiene items desde items_pedido
  -- 5. Agente imprime automaticamente usando el printer_id
  -- 
  -- IMPORTANTE: 
  -- 1. El agente debe tener configurado SUPABASE_URL y SUPABASE_ANON_KEY en .env
  -- 2. Realtime debe estar habilitado en Supabase para la tabla 'pedidos'
  -- 3. La impresora debe estar configurada en el agente con printer_id = 'atlas-burger-printer-1'
  -- 4. El campo agent_ip y agent_port NO se usan con Realtime (se mantienen para compatibilidad)
  
  -- Insertar o actualizar configuración de impresora
  INSERT INTO printer_config (
    lomiteria_id,
    printer_id,
    agent_ip,
    agent_port,
    tipo_impresora,
    nombre_impresora,
    ubicacion,
    activo
  ) VALUES (
    v_tenant_id,
    v_printer_id,
    v_agent_ip,
    v_agent_port,
    'usb',
    'Impresora Termica Cocina',
    'Cocina',
    true
  )
  ON CONFLICT (lomiteria_id) DO UPDATE
  SET
    printer_id = EXCLUDED.printer_id,
    agent_ip = EXCLUDED.agent_ip,
    agent_port = EXCLUDED.agent_port,
    tipo_impresora = EXCLUDED.tipo_impresora,
    nombre_impresora = EXCLUDED.nombre_impresora,
    ubicacion = EXCLUDED.ubicacion,
    activo = EXCLUDED.activo,
    updated_at = NOW();

  RAISE NOTICE 'Configuracion de impresora actualizada para Atlas Burger';
  RAISE NOTICE '   - Printer ID: %', v_printer_id;
  RAISE NOTICE '   - Tenant ID: %', v_tenant_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Configuracion para Supabase Realtime (SIN TUNELES)';
  RAISE NOTICE '   - El agente escucha cambios en tabla pedidos';
  RAISE NOTICE '   - Imprime automaticamente cuando estado_pedido = ''FACT''';
  RAISE NOTICE '';
  RAISE NOTICE 'Asegurate de que:';
  RAISE NOTICE '   1. El agente tenga SUPABASE_URL y SUPABASE_ANON_KEY en .env';
  RAISE NOTICE '   2. Realtime este habilitado en Supabase para la tabla ''pedidos''';
  RAISE NOTICE '   3. La impresora este configurada en el agente con printer_id: %', v_printer_id;
  RAISE NOTICE '   4. ENABLE_SUPABASE_LISTENER=true en .env del agente';

  RAISE NOTICE 'Atlas Burger: Datos insertados correctamente';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  RAISE NOTICE 'Empleados: 2 cajeros y 1 repartidor insertados';
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
-- SCRIPT COMPLETADO
-- ============================================
-- 
-- Este script:
-- 1. Actualiza el tenant "Lomiteria Don Juan" a "Atlas Burger"
-- 2. Elimina productos y categorias antiguas
-- 3. Inserta todas las categorias del menu real
-- 4. Inserta todos los productos con precios en Guaranies (GS)
-- 5. Mantiene el usuario existente vinculado
-- 6. Inserta empleados de ejemplo (cajeros y repartidores)
--
-- IMPORTANTE: 
-- - El usuario de login existente sigue funcionando
-- - Solo cambio el nombre del tenant y los productos
-- - Agregar RUC real en el UPDATE del tenant (linea ~10)
-- - Ajustar datos de empleados segun necesidades reales
-- ============================================


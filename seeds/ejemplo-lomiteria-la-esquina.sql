-- ============================================
-- LOMITERÍA LA ESQUINA - EJEMPLO
-- Este es un ejemplo de cómo sería el seed de otro cliente
-- ============================================

-- Paso 1: Crear el tenant
INSERT INTO tenants (nombre, slug, direccion, telefono, email, activo) 
VALUES (
  'Lomitería La Esquina',
  'lomiteria-la-esquina',
  'Av. Principal 456',
  '(21) 1234-5678',
  'contacto@laesquina.com',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  updated_at = NOW();

-- Paso 2: Cargar datos
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id 
  FROM tenants 
  WHERE slug = 'lomiteria-la-esquina';
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el tenant lomiteria-la-esquina';
  END IF;

  -- Eliminar datos antiguos
  DELETE FROM productos WHERE tenant_id = v_tenant_id;
  DELETE FROM categorias WHERE tenant_id = v_tenant_id;

  -- Insertar categorías
  INSERT INTO categorias (tenant_id, nombre, descripcion, orden, activa) VALUES
  (v_tenant_id, 'Lomitos', 'Lomitos tradicionales', 1, true),
  (v_tenant_id, 'Hamburguesas', 'Hamburguesas caseras', 2, true),
  (v_tenant_id, 'Bebidas', 'Bebidas frías', 3, true),
  (v_tenant_id, 'Extras', 'Acompañamientos', 4, true);

  -- Insertar productos
  INSERT INTO productos (tenant_id, categoria_id, nombre, descripcion, precio, disponible) VALUES
  
  -- Lomitos
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Lomitos'), 
   'Lomito Completo', 'Lechuga, tomate, jamón, queso, huevo', 35000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Lomitos'), 
   'Lomito Simple', 'Lechuga y tomate', 25000, true),
  
  -- Hamburguesas
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Hamburguesas'), 
   'Hamburguesa Clásica', 'Carne, lechuga, tomate, queso', 28000, true),
  
  -- Bebidas
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Coca Cola 500ml', 'Gaseosa', 5000, true),
  
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Bebidas'), 
   'Agua Mineral', 'Agua sin gas', 3000, true),
  
  -- Extras
  (v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Extras'), 
   'Papas Fritas', 'Porción mediana', 8000, true);

  RAISE NOTICE '✅ Lomitería La Esquina: Datos insertados correctamente';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
END $$;

-- Verificar
SELECT 
  c.nombre as categoria,
  COUNT(p.id) as cantidad_productos
FROM categorias c
LEFT JOIN productos p ON c.id = p.categoria_id
WHERE c.tenant_id = (SELECT id FROM tenants WHERE slug = 'lomiteria-la-esquina')
GROUP BY c.nombre
ORDER BY c.orden;


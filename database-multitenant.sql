-- ============================================
-- SISTEMA POS MULTI-TENANT
-- Base de datos para múltiples lomiterías
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA DE TENANTS (Lomiterías)
-- ============================================
DROP TABLE IF EXISTS tenants CASCADE;

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  config_impresion JSONB DEFAULT '{
    "ancho_papel": "80mm",
    "mostrar_logo": true,
    "pie_ticket": "¡Gracias por tu compra!",
    "formato_fecha": "DD/MM/YYYY HH:mm"
  }'::jsonb,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tenants IS 'Lomiterías/negocios que usan el sistema';
COMMENT ON COLUMN tenants.slug IS 'Identificador único para URLs (ej: lomiteria-don-juan)';
COMMENT ON COLUMN tenants.config_impresion IS 'Configuración personalizada de tickets';

-- ============================================
-- 2. TABLA DE USUARIOS (con roles)
-- ============================================
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'cajero', 'cocinero', 'repartidor')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema vinculados a un tenant';
COMMENT ON COLUMN usuarios.rol IS 'admin: dueño, cajero: POS, cocinero: KDS, repartidor: delivery';
COMMENT ON COLUMN usuarios.auth_user_id IS 'Vinculado con Supabase Auth';

CREATE INDEX idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_auth ON usuarios(auth_user_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- ============================================
-- 3. CATEGORÍAS (con tenant_id)
-- ============================================
DROP TABLE IF EXISTS categorias CASCADE;

CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, nombre)
);

COMMENT ON TABLE categorias IS 'Categorías de productos por lomitería';

CREATE INDEX idx_categorias_tenant ON categorias(tenant_id);
CREATE INDEX idx_categorias_activa ON categorias(activa);

-- ============================================
-- 4. PRODUCTOS (con tenant_id)
-- ============================================
DROP TABLE IF EXISTS productos CASCADE;

CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  imagen_url TEXT,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE productos IS 'Productos por lomitería';

CREATE INDEX idx_productos_tenant ON productos(tenant_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_disponible ON productos(disponible);

-- ============================================
-- 5. CLIENTES (con tenant_id)
-- ============================================
DROP TABLE IF EXISTS clientes CASCADE;

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  puntos_totales INTEGER DEFAULT 0 CHECK (puntos_totales >= 0),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE clientes IS 'Clientes de cada lomitería';
COMMENT ON COLUMN clientes.puntos_totales IS 'Puntos de fidelidad acumulados';

CREATE INDEX idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_email ON clientes(email);

-- ============================================
-- 6. PEDIDOS (con tenant_id y usuario_id)
-- ============================================
DROP TABLE IF EXISTS pedidos CASCADE;

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero_pedido INTEGER NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('local', 'delivery', 'para_llevar')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  puntos_generados INTEGER DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, numero_pedido)
);

COMMENT ON TABLE pedidos IS 'Pedidos por lomitería';
COMMENT ON COLUMN pedidos.usuario_id IS 'Quién tomó el pedido (cajero)';
COMMENT ON COLUMN pedidos.numero_pedido IS 'Número secuencial por tenant';

CREATE INDEX idx_pedidos_tenant ON pedidos(tenant_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_tipo ON pedidos(tipo);
CREATE INDEX idx_pedidos_fecha ON pedidos(created_at);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);

-- ============================================
-- 7. ITEMS DE PEDIDO
-- ============================================
DROP TABLE IF EXISTS items_pedido CASCADE;

CREATE TABLE items_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE items_pedido IS 'Detalle de productos en cada pedido';

CREATE INDEX idx_items_pedido ON items_pedido(pedido_id);
CREATE INDEX idx_items_producto ON items_pedido(producto_id);

-- ============================================
-- 8. TRANSACCIONES DE PUNTOS
-- ============================================
DROP TABLE IF EXISTS transacciones_puntos CASCADE;

CREATE TABLE transacciones_puntos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ganado', 'canjeado', 'ajuste')),
  puntos INTEGER NOT NULL,
  saldo_anterior INTEGER NOT NULL,
  saldo_nuevo INTEGER NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE transacciones_puntos IS 'Historial de puntos de fidelidad';

CREATE INDEX idx_transacciones_cliente ON transacciones_puntos(cliente_id);
CREATE INDEX idx_transacciones_pedido ON transacciones_puntos(pedido_id);
CREATE INDEX idx_transacciones_fecha ON transacciones_puntos(created_at);

-- ============================================
-- 9. PROMOCIONES (con tenant_id)
-- ============================================
DROP TABLE IF EXISTS promociones CASCADE;

CREATE TABLE promociones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('descuento_porcentaje', 'descuento_fijo', 'puntos_extra', 'producto_gratis')),
  valor NUMERIC(10,2),
  puntos_requeridos INTEGER,
  fecha_inicio DATE,
  fecha_fin DATE,
  dias_semana INTEGER[] CHECK (dias_semana <@ ARRAY[0,1,2,3,4,5,6]),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE promociones IS 'Promociones y descuentos por lomitería';
COMMENT ON COLUMN promociones.dias_semana IS 'Días aplicables: 0=Dom, 1=Lun, ..., 6=Sáb';

CREATE INDEX idx_promociones_tenant ON promociones(tenant_id);
CREATE INDEX idx_promociones_activa ON promociones(activa);
CREATE INDEX idx_promociones_fechas ON promociones(fecha_inicio, fecha_fin);

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función: Generar número de pedido secuencial por tenant
CREATE OR REPLACE FUNCTION generar_numero_pedido(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  nuevo_numero INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_pedido), 0) + 1
  INTO nuevo_numero
  FROM pedidos
  WHERE tenant_id = p_tenant_id;
  
  RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar puntos del cliente
CREATE OR REPLACE FUNCTION actualizar_puntos_cliente()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'entregado' AND OLD.estado != 'entregado' THEN
    IF NEW.cliente_id IS NOT NULL AND NEW.puntos_generados > 0 THEN
      UPDATE clientes
      SET puntos_totales = puntos_totales + NEW.puntos_generados
      WHERE id = NEW.cliente_id;
      
      INSERT INTO transacciones_puntos (
        cliente_id,
        pedido_id,
        tipo,
        puntos,
        saldo_anterior,
        saldo_nuevo,
        descripcion
      )
      SELECT
        NEW.cliente_id,
        NEW.id,
        'ganado',
        NEW.puntos_generados,
        puntos_totales - NEW.puntos_generados,
        puntos_totales,
        'Puntos ganados por pedido #' || NEW.numero_pedido
      FROM clientes
      WHERE id = NEW.cliente_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Actualizar puntos al entregar pedido
DROP TRIGGER IF EXISTS trigger_actualizar_puntos ON pedidos;
CREATE TRIGGER trigger_actualizar_puntos
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_puntos_cliente();

-- Función: Auto-generar número de pedido
CREATE OR REPLACE FUNCTION auto_generar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_pedido IS NULL THEN
    NEW.numero_pedido := generar_numero_pedido(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_numero_pedido ON pedidos;
CREATE TRIGGER trigger_auto_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION auto_generar_numero_pedido();

-- Función: Actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger updated_at a todas las tablas
DROP TRIGGER IF EXISTS trigger_tenants_updated ON tenants;
CREATE TRIGGER trigger_tenants_updated BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_usuarios_updated ON usuarios;
CREATE TRIGGER trigger_usuarios_updated BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_categorias_updated ON categorias;
CREATE TRIGGER trigger_categorias_updated BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_productos_updated ON productos;
CREATE TRIGGER trigger_productos_updated BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_clientes_updated ON clientes;
CREATE TRIGGER trigger_clientes_updated BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_pedidos_updated ON pedidos;
CREATE TRIGGER trigger_pedidos_updated BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_promociones_updated ON promociones;
CREATE TRIGGER trigger_promociones_updated BEFORE UPDATE ON promociones
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - SIN RECURSIÓN
-- ============================================

-- DESHABILITAR RLS temporalmente para desarrollo
-- Una vez que haya múltiples tenants, habilitar y ajustar políticas

ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_puntos DISABLE ROW LEVEL SECURITY;
ALTER TABLE promociones DISABLE ROW LEVEL SECURITY;

-- NOTA: Cuando haya múltiples lomiterías, habilitar RLS con estas políticas simples:
--
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (auth_user_id = auth.uid());
--
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;  
-- CREATE POLICY "tenants_select" ON tenants FOR SELECT 
--   USING (id IN (SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid()));
--
-- Y así para cada tabla, usando EXISTS en lugar de IN para evitar recursión

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Pedidos completos con toda la información
CREATE OR REPLACE VIEW vista_pedidos_completos AS
SELECT 
  p.id,
  p.tenant_id,
  t.nombre as tenant_nombre,
  p.numero_pedido,
  p.tipo,
  p.estado,
  p.total,
  p.puntos_generados,
  p.created_at,
  c.nombre as cliente_nombre,
  c.telefono as cliente_telefono,
  c.direccion as cliente_direccion,
  u.nombre as usuario_nombre,
  u.rol as usuario_rol,
  json_agg(
    json_build_object(
      'producto_nombre', ip.producto_nombre,
      'cantidad', ip.cantidad,
      'precio_unitario', ip.precio_unitario,
      'subtotal', ip.subtotal,
      'notas', ip.notas
    ) ORDER BY ip.created_at
  ) as items
FROM pedidos p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN tenants t ON p.tenant_id = t.id
LEFT JOIN items_pedido ip ON p.id = ip.pedido_id
GROUP BY p.id, p.tenant_id, t.nombre, p.numero_pedido, p.tipo, p.estado, 
         p.total, p.puntos_generados, p.created_at, c.nombre, c.telefono, 
         c.direccion, u.nombre, u.rol;

-- Vista: Productos con categoría
CREATE OR REPLACE VIEW vista_productos_completos AS
SELECT 
  p.*,
  c.nombre as categoria_nombre,
  t.nombre as tenant_nombre
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN tenants t ON p.tenant_id = t.id;

-- Vista: Top clientes por tenant
CREATE OR REPLACE VIEW vista_top_clientes AS
SELECT 
  c.tenant_id,
  t.nombre as tenant_nombre,
  c.id,
  c.nombre,
  c.telefono,
  c.puntos_totales,
  COUNT(p.id) as total_pedidos,
  COALESCE(SUM(p.total), 0) as total_gastado
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id AND p.estado = 'entregado'
LEFT JOIN tenants t ON c.tenant_id = t.id
GROUP BY c.tenant_id, t.nombre, c.id, c.nombre, c.telefono, c.puntos_totales
ORDER BY total_gastado DESC;

-- ============================================
-- DATOS DE EJEMPLO (PARA TESTING)
-- ============================================

-- Tenant de ejemplo 1: Lomitería Don Juan
INSERT INTO tenants (nombre, slug, direccion, telefono, email) VALUES
('Lomitería Don Juan', 'lomiteria-don-juan', 'Av. Principal 123', '(11) 4567-8901', 'contacto@donjuan.com');

-- Tenant de ejemplo 2: El Lomito de la Esquina
INSERT INTO tenants (nombre, slug, direccion, telefono, email) VALUES
('El Lomito de la Esquina', 'lomito-esquina', 'Calle 50 Nº 456', '(11) 4567-8902', 'info@lomitoesquina.com');

-- NOTA: Los usuarios deben crearse después de registrarse en Supabase Auth
-- Por ahora dejamos la tabla usuarios vacía

-- Categorías para Lomitería Don Juan
INSERT INTO categorias (tenant_id, nombre, descripcion, orden) 
SELECT id, 'Lomitos', 'Lomitos tradicionales y especiales', 1 FROM tenants WHERE slug = 'lomiteria-don-juan'
UNION ALL
SELECT id, 'Hamburguesas', 'Hamburguesas caseras', 2 FROM tenants WHERE slug = 'lomiteria-don-juan'
UNION ALL
SELECT id, 'Bebidas', 'Bebidas frías y calientes', 3 FROM tenants WHERE slug = 'lomiteria-don-juan'
UNION ALL
SELECT id, 'Extras', 'Papas, aros de cebolla, etc', 4 FROM tenants WHERE slug = 'lomiteria-don-juan'
UNION ALL
SELECT id, 'Promociones', 'Combos y ofertas', 5 FROM tenants WHERE slug = 'lomiteria-don-juan';

-- Categorías para El Lomito de la Esquina
INSERT INTO categorias (tenant_id, nombre, descripcion, orden) 
SELECT id, 'Lomitos', 'Nuestros lomitos especiales', 1 FROM tenants WHERE slug = 'lomito-esquina'
UNION ALL
SELECT id, 'Hamburguesas', 'Hamburguesas artesanales', 2 FROM tenants WHERE slug = 'lomito-esquina'
UNION ALL
SELECT id, 'Bebidas', 'Gaseosas y jugos', 3 FROM tenants WHERE slug = 'lomito-esquina';

-- Productos para Lomitería Don Juan
WITH tenant AS (SELECT id FROM tenants WHERE slug = 'lomiteria-don-juan'),
     cat_lomitos AS (SELECT id FROM categorias WHERE tenant_id = (SELECT id FROM tenant) AND nombre = 'Lomitos'),
     cat_hamburguesas AS (SELECT id FROM categorias WHERE tenant_id = (SELECT id FROM tenant) AND nombre = 'Hamburguesas'),
     cat_bebidas AS (SELECT id FROM categorias WHERE tenant_id = (SELECT id FROM tenant) AND nombre = 'Bebidas'),
     cat_extras AS (SELECT id FROM categorias WHERE tenant_id = (SELECT id FROM tenant) AND nombre = 'Extras')
INSERT INTO productos (tenant_id, categoria_id, nombre, descripcion, precio) VALUES
((SELECT id FROM tenant), (SELECT id FROM cat_lomitos), 'Lomito Completo', 'Lomito con lechuga, tomate, jamón, queso y huevo', 4500),
((SELECT id FROM tenant), (SELECT id FROM cat_lomitos), 'Lomito Especial', 'Lomito completo + bacon + cebolla caramelizada', 5200),
((SELECT id FROM tenant), (SELECT id FROM cat_lomitos), 'Lomito Simple', 'Lomito con lechuga y tomate', 3800),
((SELECT id FROM tenant), (SELECT id FROM cat_hamburguesas), 'Hamburguesa Simple', 'Carne, lechuga, tomate', 2800),
((SELECT id FROM tenant), (SELECT id FROM cat_hamburguesas), 'Hamburguesa Completa', 'Carne, lechuga, tomate, jamón, queso, huevo', 3800),
((SELECT id FROM tenant), (SELECT id FROM cat_bebidas), 'Coca Cola 500ml', 'Gaseosa', 1200),
((SELECT id FROM tenant), (SELECT id FROM cat_bebidas), 'Agua Mineral 500ml', 'Agua sin gas', 800),
((SELECT id FROM tenant), (SELECT id FROM cat_extras), 'Papas Fritas', 'Porción grande', 1500);

-- Productos para El Lomito de la Esquina
WITH tenant AS (SELECT id FROM tenants WHERE slug = 'lomito-esquina'),
     cat_lomitos AS (SELECT id FROM categorias WHERE tenant_id = (SELECT id FROM tenant) AND nombre = 'Lomitos'),
     cat_bebidas AS (SELECT id FROM categorias WHERE tenant_id = (SELECT id FROM tenant) AND nombre = 'Bebidas')
INSERT INTO productos (tenant_id, categoria_id, nombre, descripcion, precio) VALUES
((SELECT id FROM tenant), (SELECT id FROM cat_lomitos), 'Lomito de la Casa', 'Nuestro lomito especial', 5000),
((SELECT id FROM tenant), (SELECT id FROM cat_lomitos), 'Lomito Clásico', 'Lomito tradicional', 4000),
((SELECT id FROM tenant), (SELECT id FROM cat_bebidas), 'Coca Cola 500ml', 'Gaseosa', 1000);

-- Clientes de ejemplo para Don Juan
INSERT INTO clientes (tenant_id, nombre, telefono, direccion, puntos_totales)
SELECT id, 'Juan Pérez', '(11) 1234-5678', 'Calle 1 Nº 100', 150 FROM tenants WHERE slug = 'lomiteria-don-juan'
UNION ALL
SELECT id, 'María González', '(11) 8765-4321', 'Av. 2 Nº 200', 250 FROM tenants WHERE slug = 'lomiteria-don-juan'
UNION ALL
SELECT id, 'Carlos Rodríguez', '(11) 5555-6666', 'Calle 3 Nº 300', 80 FROM tenants WHERE slug = 'lomiteria-don-juan';

-- Promociones para Don Juan
INSERT INTO promociones (tenant_id, nombre, descripcion, tipo, valor, dias_semana, activa)
SELECT 
  id, 
  '2x1 en Lomitos', 
  'Todos los martes 2x1 en lomitos', 
  'descuento_porcentaje', 
  50, 
  ARRAY[2], 
  true 
FROM tenants WHERE slug = 'lomiteria-don-juan'
UNION ALL
SELECT 
  id, 
  'Puntos Dobles Fin de Semana', 
  'Viernes a domingo ganás el doble de puntos', 
  'puntos_extra', 
  100, 
  ARRAY[5,6,0], 
  true 
FROM tenants WHERE slug = 'lomiteria-don-juan';

-- ============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_pedidos_tenant_estado ON pedidos(tenant_id, estado);
CREATE INDEX idx_pedidos_tenant_fecha ON pedidos(tenant_id, created_at DESC);
CREATE INDEX idx_productos_tenant_disponible ON productos(tenant_id, disponible);
CREATE INDEX idx_clientes_tenant_puntos ON clientes(tenant_id, puntos_totales DESC);

-- ============================================
-- VINCULAR USUARIO ADMIN CON TENANT
-- ============================================

-- IMPORTANTE: Este usuario debe existir previamente en Supabase Auth
-- Email: admin@lomiteria-don-juan.com
-- Password: Admin123!
-- UUID: da9cd961-616e-4532-87a3-887525da0af7

INSERT INTO usuarios (tenant_id, auth_user_id, email, nombre, rol, activo)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'lomiteria-don-juan'),
  'da9cd961-616e-4532-87a3-887525da0af7',
  'admin@lomiteria-don-juan.com',
  'Admin Don Juan',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Verificación: Ver usuarios vinculados
-- SELECT u.id, u.email, u.nombre, u.rol, t.nombre as tenant_nombre
-- FROM usuarios u
-- JOIN tenants t ON u.tenant_id = t.id;

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================

-- Este script debe ejecutarse en el SQL Editor de Supabase
-- Una vez ejecutado, tendrás la estructura completa multi-tenant

COMMENT ON DATABASE postgres IS 'Sistema POS Multi-tenant para Lomiterías';


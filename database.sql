-- ============================================
-- SISTEMA POS LOMITERÍA - ESQUEMA DE BASE DE DATOS
-- ============================================
-- Supabase PostgreSQL Schema
-- Versión: 1.0
-- Fecha: Noviembre 2025
-- ============================================

-- ============================================
-- ELIMINAR TABLAS SI EXISTEN (para testing)
-- ============================================
DROP TABLE IF EXISTS transacciones_puntos CASCADE;
DROP TABLE IF EXISTS items_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS promociones CASCADE;

-- ============================================
-- TABLA: categorias
-- Categorías de productos del menú
-- ============================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: productos
-- Catálogo de productos disponibles
-- ============================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  disponible BOOLEAN DEFAULT true,
  imagen_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: clientes
-- Base de datos de clientes con programa de puntos
-- ============================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  puntos_totales INTEGER DEFAULT 0 CHECK (puntos_totales >= 0),
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ultima_compra TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN DEFAULT true,
  notas TEXT
);

-- ============================================
-- TABLA: pedidos
-- Pedidos realizados por los clientes
-- ============================================
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido SERIAL UNIQUE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('delivery', 'local', 'takeaway')),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado')),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  puntos_generados INTEGER DEFAULT 0,
  notas TEXT,
  direccion_entrega TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fecha_entregado TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- TABLA: items_pedido
-- Detalle de productos en cada pedido
-- ============================================
CREATE TABLE items_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre VARCHAR(200) NOT NULL, -- Guardar nombre por si se elimina el producto
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  personalizaciones JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: transacciones_puntos
-- Historial de movimientos de puntos
-- ============================================
CREATE TABLE transacciones_puntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ganado', 'canjeado', 'ajuste', 'expiracion')),
  puntos INTEGER NOT NULL,
  saldo_anterior INTEGER NOT NULL,
  saldo_nuevo INTEGER NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_responsable VARCHAR(100)
);

-- ============================================
-- TABLA: promociones
-- Configuración de promociones y multiplicadores de puntos
-- ============================================
CREATE TABLE promociones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('puntos', 'descuento', 'regalo')),
  multiplicador DECIMAL(5,2) DEFAULT 1.0 CHECK (multiplicador >= 0),
  descuento_porcentaje DECIMAL(5,2) CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
  dias_semana INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  fecha_inicio DATE,
  fecha_fin DATE,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN DE QUERIES
-- ============================================

-- Índices para pedidos (tabla más consultada)
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_tipo ON pedidos(tipo);
CREATE INDEX idx_pedidos_fecha_creacion ON pedidos(fecha_creacion DESC);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);

-- Índices para clientes
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_puntos ON clientes(puntos_totales DESC);
CREATE INDEX idx_clientes_activo ON clientes(activo);

-- Índices para productos
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_disponible ON productos(disponible);
CREATE INDEX idx_productos_nombre ON productos(nombre);

-- Índices para items_pedido
CREATE INDEX idx_items_pedido_pedido_id ON items_pedido(pedido_id);
CREATE INDEX idx_items_pedido_producto_id ON items_pedido(producto_id);

-- Índices para transacciones_puntos
CREATE INDEX idx_transacciones_cliente_id ON transacciones_puntos(cliente_id);
CREATE INDEX idx_transacciones_fecha ON transacciones_puntos(fecha DESC);
CREATE INDEX idx_transacciones_tipo ON transacciones_puntos(tipo);

-- Índices para categorías
CREATE INDEX idx_categorias_orden ON categorias(orden);
CREATE INDEX idx_categorias_activa ON categorias(activa);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promociones_updated_at BEFORE UPDATE ON promociones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora para desarrollo)
-- En producción, ajustar según roles de usuario

-- Categorías: lectura pública
CREATE POLICY "Permitir lectura pública de categorias" ON categorias
    FOR SELECT USING (true);
CREATE POLICY "Permitir todo en categorias" ON categorias
    FOR ALL USING (true);

-- Productos: lectura pública
CREATE POLICY "Permitir lectura pública de productos" ON productos
    FOR SELECT USING (true);
CREATE POLICY "Permitir todo en productos" ON productos
    FOR ALL USING (true);

-- Clientes: acceso completo
CREATE POLICY "Permitir todo en clientes" ON clientes
    FOR ALL USING (true);

-- Pedidos: acceso completo
CREATE POLICY "Permitir todo en pedidos" ON pedidos
    FOR ALL USING (true);

-- Items pedido: acceso completo
CREATE POLICY "Permitir todo en items_pedido" ON items_pedido
    FOR ALL USING (true);

-- Transacciones puntos: acceso completo
CREATE POLICY "Permitir todo en transacciones_puntos" ON transacciones_puntos
    FOR ALL USING (true);

-- Promociones: lectura pública
CREATE POLICY "Permitir lectura pública de promociones" ON promociones
    FOR SELECT USING (true);
CREATE POLICY "Permitir todo en promociones" ON promociones
    FOR ALL USING (true);

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar categorías
INSERT INTO categorias (nombre, descripcion, orden, activa) VALUES
('Lomitos', 'Lomitos completos y especiales', 1, true),
('Hamburguesas', 'Hamburguesas simples y dobles', 2, true),
('Bebidas', 'Gaseosas, aguas y jugos', 3, true),
('Extras', 'Papas fritas, aros de cebolla, salsas', 4, true),
('Promociones', 'Combos y ofertas especiales', 5, true);

-- Insertar productos (obtener IDs de categorías)
DO $$
DECLARE
    cat_lomitos UUID;
    cat_hamburguesas UUID;
    cat_bebidas UUID;
    cat_extras UUID;
    cat_promociones UUID;
BEGIN
    -- Obtener IDs de categorías
    SELECT id INTO cat_lomitos FROM categorias WHERE nombre = 'Lomitos';
    SELECT id INTO cat_hamburguesas FROM categorias WHERE nombre = 'Hamburguesas';
    SELECT id INTO cat_bebidas FROM categorias WHERE nombre = 'Bebidas';
    SELECT id INTO cat_extras FROM categorias WHERE nombre = 'Extras';
    SELECT id INTO cat_promociones FROM categorias WHERE nombre = 'Promociones';

    -- Insertar Lomitos
    INSERT INTO productos (nombre, descripcion, precio, categoria_id, disponible) VALUES
    ('Lomito Completo', 'Lomito con lechuga, tomate, jamón, queso y huevo', 4500.00, cat_lomitos, true),
    ('Lomito Especial', 'Lomito completo + bacon + cebolla caramelizada', 5200.00, cat_lomitos, true),
    ('Lomito Simple', 'Lomito con lechuga y tomate', 3800.00, cat_lomitos, true),
    ('Lomito Vegetariano', 'Medallón de vegetales, lechuga, tomate y queso', 4000.00, cat_lomitos, true);

    -- Insertar Hamburguesas
    INSERT INTO productos (nombre, descripcion, precio, categoria_id, disponible) VALUES
    ('Hamburguesa Simple', 'Carne, lechuga, tomate', 2800.00, cat_hamburguesas, true),
    ('Hamburguesa Completa', 'Carne, lechuga, tomate, jamón, queso y huevo', 3500.00, cat_hamburguesas, true),
    ('Hamburguesa Doble', 'Doble carne, queso cheddar, bacon', 4200.00, cat_hamburguesas, true),
    ('Hamburguesa BBQ', 'Carne, queso, cebolla caramelizada, salsa BBQ', 3800.00, cat_hamburguesas, true);

    -- Insertar Bebidas
    INSERT INTO productos (nombre, descripcion, precio, categoria_id, disponible) VALUES
    ('Coca Cola 500ml', 'Coca Cola botella 500ml', 1200.00, cat_bebidas, true),
    ('Coca Cola 1.5L', 'Coca Cola botella 1.5 litros', 2000.00, cat_bebidas, true),
    ('Sprite 500ml', 'Sprite botella 500ml', 1200.00, cat_bebidas, true),
    ('Agua Mineral 500ml', 'Agua mineral sin gas', 800.00, cat_bebidas, true),
    ('Jugo de Naranja', 'Jugo natural de naranja exprimida', 1500.00, cat_bebidas, true);

    -- Insertar Extras
    INSERT INTO productos (nombre, descripcion, precio, categoria_id, disponible) VALUES
    ('Papas Fritas Medianas', 'Porción mediana de papas fritas', 1500.00, cat_extras, true),
    ('Papas Fritas Grandes', 'Porción grande de papas fritas', 2200.00, cat_extras, true),
    ('Aros de Cebolla', 'Porción de aros de cebolla rebozados', 1800.00, cat_extras, true),
    ('Salsa Extra', 'Porción adicional de salsa (ketchup, mostaza, mayo)', 300.00, cat_extras, true);

    -- Insertar Promociones
    INSERT INTO productos (nombre, descripcion, precio, categoria_id, disponible) VALUES
    ('Combo Lomito', 'Lomito completo + papas + bebida 500ml', 6500.00, cat_promociones, true),
    ('Combo Hamburguesa', 'Hamburguesa completa + papas + bebida 500ml', 5200.00, cat_promociones, true),
    ('Combo Pareja', '2 lomitos + papas grandes + 2 bebidas 500ml', 12000.00, cat_promociones, true);
END $$;

-- Insertar clientes de ejemplo
INSERT INTO clientes (telefono, nombre, email, puntos_totales, activo) VALUES
('099123456', 'Juan Pérez', 'juan.perez@email.com', 150, true),
('098765432', 'María González', 'maria.gonzalez@email.com', 320, true),
('091234567', 'Carlos Rodríguez', NULL, 80, true),
('099888777', 'Ana Martínez', 'ana.martinez@email.com', 450, true);

-- Insertar promoción de ejemplo
INSERT INTO promociones (nombre, descripcion, tipo, multiplicador, dias_semana, fecha_inicio, activa) VALUES
('Puntos x2 los Martes', 'Doble de puntos todos los martes', 'puntos', 2.0, ARRAY[2], '2025-01-01', true),
('Happy Hour Viernes', 'Viernes de 18 a 22hs - 50% más de puntos', 'puntos', 1.5, ARRAY[5], '2025-01-01', true),
('Descuento Fin de Semana', '10% de descuento sábados y domingos', 'descuento', 1.0, ARRAY[6,0], '2025-01-01', true);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de productos con nombre de categoría
CREATE OR REPLACE VIEW vista_productos_completos AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.disponible,
    p.imagen_url,
    c.nombre AS categoria_nombre,
    c.id AS categoria_id,
    c.orden AS categoria_orden
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.disponible = true AND (c.activa = true OR c.activa IS NULL)
ORDER BY c.orden, p.nombre;

-- Vista de pedidos con información completa
CREATE OR REPLACE VIEW vista_pedidos_completos AS
SELECT 
    ped.id,
    ped.numero_pedido,
    ped.tipo,
    ped.estado,
    ped.total,
    ped.puntos_generados,
    ped.notas,
    ped.fecha_creacion,
    cli.nombre AS cliente_nombre,
    cli.telefono AS cliente_telefono,
    cli.id AS cliente_id,
    COUNT(ip.id) AS cantidad_items
FROM pedidos ped
LEFT JOIN clientes cli ON ped.cliente_id = cli.id
LEFT JOIN items_pedido ip ON ped.id = ip.pedido_id
GROUP BY ped.id, cli.id;

-- Vista de top clientes
CREATE OR REPLACE VIEW vista_top_clientes AS
SELECT 
    c.id,
    c.nombre,
    c.telefono,
    c.puntos_totales,
    COUNT(p.id) AS total_pedidos,
    COALESCE(SUM(p.total), 0) AS total_gastado,
    MAX(p.fecha_creacion) AS ultima_compra
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id
WHERE c.activo = true
GROUP BY c.id
ORDER BY c.puntos_totales DESC, total_gastado DESC;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para calcular puntos según monto y promociones
CREATE OR REPLACE FUNCTION calcular_puntos(
    monto DECIMAL,
    dia_semana INTEGER,
    OUT puntos INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    multiplicador DECIMAL := 1.0;
    promo RECORD;
BEGIN
    -- Base: 1 punto por cada $100
    puntos := FLOOR(monto / 100);
    
    -- Buscar promoción activa para el día
    SELECT multiplicador INTO multiplicador
    FROM promociones
    WHERE activa = true
        AND tipo = 'puntos'
        AND dia_semana = ANY(dias_semana)
        AND (fecha_inicio IS NULL OR fecha_inicio <= CURRENT_DATE)
        AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    ORDER BY multiplicador DESC
    LIMIT 1;
    
    -- Aplicar multiplicador si existe
    IF multiplicador IS NOT NULL THEN
        puntos := FLOOR(puntos * multiplicador);
    END IF;
END;
$$;

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================

-- Verificar que todo se creó correctamente
SELECT 'Tablas creadas:' AS info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Datos insertados:' AS info;
SELECT 'Categorías: ' || COUNT(*) FROM categorias
UNION ALL
SELECT 'Productos: ' || COUNT(*) FROM productos
UNION ALL
SELECT 'Clientes: ' || COUNT(*) FROM clientes
UNION ALL
SELECT 'Promociones: ' || COUNT(*) FROM promociones;

-- ============================================
-- ¡LISTO! Base de datos configurada ✅
-- ============================================


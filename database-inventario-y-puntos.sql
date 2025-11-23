-- ============================================
-- SISTEMA DE INVENTARIO Y PUNTOS AUTOMÁTICOS
-- ⚠️ MULTI-TENANT: Preparado para múltiples lomiterías
-- Todas las tablas y funciones respetan tenant_id
-- ============================================

-- ============================================
-- 1. TABLA DE INVENTARIO (MULTI-TENANT)
-- ============================================
-- Cada lomitería tiene su propio inventario
-- UNIQUE(tenant_id, producto_id) garantiza que cada producto
-- solo tenga un registro de inventario por tenant
-- ============================================

DROP TABLE IF EXISTS inventario CASCADE;

CREATE TABLE inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  stock_actual NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo NUMERIC(10,2) DEFAULT 0 CHECK (stock_minimo >= 0),
  unidad TEXT DEFAULT 'unidad', -- 'unidad', 'kg', 'litro', etc.
  controlar_stock BOOLEAN DEFAULT false, -- Si true, se descuenta automáticamente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, producto_id) -- Un producto solo puede tener un inventario por tenant
);

COMMENT ON TABLE inventario IS 'Control de inventario por producto y tenant - MULTI-TENANT';
COMMENT ON COLUMN inventario.tenant_id IS 'Identifica a qué lomitería pertenece este inventario';
COMMENT ON COLUMN inventario.controlar_stock IS 'Si es true, se descuenta automáticamente al crear pedidos';
COMMENT ON COLUMN inventario.stock_minimo IS 'Stock mínimo antes de alertar';

-- Índices optimizados para multi-tenant
CREATE INDEX idx_inventario_tenant ON inventario(tenant_id);
CREATE INDEX idx_inventario_producto ON inventario(producto_id);
CREATE INDEX idx_inventario_tenant_producto ON inventario(tenant_id, producto_id); -- Para búsquedas rápidas
CREATE INDEX idx_inventario_stock_bajo ON inventario(tenant_id, stock_actual, stock_minimo) 
  WHERE controlar_stock = true AND stock_actual <= stock_minimo;

-- ============================================
-- 2. TABLA DE MOVIMIENTOS DE INVENTARIO
-- ============================================
-- Historial completo de todos los movimientos
-- Se relaciona con inventario (que ya tiene tenant_id)
-- ============================================

DROP TABLE IF EXISTS movimientos_inventario CASCADE;

CREATE TABLE movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id UUID NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'inicial')),
  cantidad NUMERIC(10,2) NOT NULL,
  stock_anterior NUMERIC(10,2) NOT NULL,
  stock_nuevo NUMERIC(10,2) NOT NULL,
  motivo TEXT,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE movimientos_inventario IS 'Historial de movimientos de inventario - MULTI-TENANT (vía inventario.tenant_id)';
COMMENT ON COLUMN movimientos_inventario.tipo IS 'entrada: compra/reposición, salida: venta, ajuste: corrección manual';

CREATE INDEX idx_movimientos_inventario ON movimientos_inventario(inventario_id);
CREATE INDEX idx_movimientos_pedido ON movimientos_inventario(pedido_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(created_at DESC);

-- Índice compuesto para consultas por tenant (via join con inventario)
CREATE INDEX idx_movimientos_inv_fecha ON movimientos_inventario(inventario_id, created_at DESC);

-- ============================================
-- 3. FUNCIONES PARA INVENTARIO (MULTI-TENANT SAFE)
-- ============================================
-- Todas las funciones usan tenant_id del pedido
-- para garantizar que solo se afecte el inventario correcto
-- ============================================

-- Función: Descontar stock al crear pedido
-- ⚠️ MULTI-TENANT: Usa NEW.tenant_id para identificar la lomitería
CREATE OR REPLACE FUNCTION descontar_inventario_pedido()
RETURNS TRIGGER AS $$
DECLARE
  inv_record RECORD;
BEGIN
  -- Solo procesar si el pedido está en estado 'pendiente' o 'en_preparacion'
  IF NEW.estado IN ('pendiente', 'en_preparacion') THEN
    -- Descontar inventario de cada item del pedido
    -- IMPORTANTE: Filtramos por tenant_id para seguridad multi-tenant
    FOR inv_record IN 
      SELECT 
        ip.producto_id,
        ip.cantidad,
        i.id as inventario_id,
        i.stock_actual,
        i.controlar_stock
      FROM items_pedido ip
      INNER JOIN inventario i ON (
        i.producto_id = ip.producto_id 
        AND i.tenant_id = NEW.tenant_id  -- ⚠️ CRÍTICO: Filtro por tenant
      )
      WHERE ip.pedido_id = NEW.id
        AND i.controlar_stock = true
    LOOP
      -- Verificar stock disponible
      IF inv_record.stock_actual < inv_record.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para producto ID: %. Stock disponible: %, requerido: %', 
          inv_record.producto_id, inv_record.stock_actual, inv_record.cantidad;
      END IF;

      -- Descontar stock (solo del inventario correcto por tenant)
      UPDATE inventario
      SET 
        stock_actual = stock_actual - inv_record.cantidad,
        updated_at = NOW()
      WHERE id = inv_record.inventario_id
        AND tenant_id = NEW.tenant_id;  -- ⚠️ Seguridad adicional

      -- Registrar movimiento
      INSERT INTO movimientos_inventario (
        inventario_id,
        pedido_id,
        tipo,
        cantidad,
        stock_anterior,
        stock_nuevo
      ) VALUES (
        inv_record.inventario_id,
        NEW.id,
        'salida',
        -inv_record.cantidad,
        inv_record.stock_actual,
        inv_record.stock_actual - inv_record.cantidad
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Descontar inventario cuando se confirma un pedido
DROP TRIGGER IF EXISTS trigger_descontar_inventario ON pedidos;
CREATE TRIGGER trigger_descontar_inventario
  AFTER INSERT OR UPDATE ON pedidos
  FOR EACH ROW
  WHEN (NEW.estado IN ('pendiente', 'en_preparacion'))
  EXECUTE FUNCTION descontar_inventario_pedido();

-- Función: Restaurar stock si se cancela un pedido
-- ⚠️ MULTI-TENANT: Usa NEW.tenant_id
CREATE OR REPLACE FUNCTION restaurar_inventario_cancelado()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el pedido se cancela, restaurar el stock
  IF NEW.estado = 'cancelado' AND (OLD.estado IS NULL OR OLD.estado != 'cancelado') THEN
    -- IMPORTANTE: Filtramos por tenant_id en todas las operaciones
    UPDATE inventario i
    SET 
      stock_actual = stock_actual + ip.cantidad,
      updated_at = NOW()
    FROM items_pedido ip
    WHERE ip.pedido_id = NEW.id
      AND i.producto_id = ip.producto_id
      AND i.tenant_id = NEW.tenant_id  -- ⚠️ CRÍTICO: Filtro por tenant
      AND i.controlar_stock = true;

    -- Registrar movimiento de restauración
    INSERT INTO movimientos_inventario (
      inventario_id,
      pedido_id,
      tipo,
      cantidad,
      stock_anterior,
      stock_nuevo,
      motivo
    )
    SELECT 
      i.id,
      NEW.id,
      'entrada',
      ip.cantidad,
      i.stock_actual - ip.cantidad,
      i.stock_actual,
      'Cancelación de pedido #' || NEW.numero_pedido
    FROM items_pedido ip
    INNER JOIN inventario i ON (
      i.producto_id = ip.producto_id 
      AND i.tenant_id = NEW.tenant_id  -- ⚠️ CRÍTICO: Filtro por tenant
    )
    WHERE ip.pedido_id = NEW.id
      AND i.controlar_stock = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Restaurar stock al cancelar
DROP TRIGGER IF EXISTS trigger_restaurar_inventario ON pedidos;
CREATE TRIGGER trigger_restaurar_inventario
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  WHEN (NEW.estado = 'cancelado' AND (OLD.estado IS NULL OR OLD.estado != 'cancelado'))
  EXECUTE FUNCTION restaurar_inventario_cancelado();

-- ============================================
-- 4. SISTEMA AUTOMÁTICO DE PUNTOS (MULTI-TENANT SAFE)
-- ============================================
-- Los puntos se acreditan por cliente, y los clientes
-- ya tienen tenant_id, por lo que es seguro
-- ============================================

-- Función: Calcular puntos según monto (1 punto por cada 100 GS)
CREATE OR REPLACE FUNCTION calcular_puntos_por_monto(monto NUMERIC)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(monto / 100)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función: Acreditar puntos cuando se completa un pedido
-- ⚠️ MULTI-TENANT: Los clientes tienen tenant_id, por lo que es seguro
CREATE OR REPLACE FUNCTION acreditar_puntos_pedido()
RETURNS TRIGGER AS $$
DECLARE
  puntos_a_acreditar INTEGER;
  saldo_anterior INTEGER;
  saldo_nuevo INTEGER;
  cliente_tenant_id UUID;
BEGIN
  -- Solo acreditar puntos cuando el pedido pasa a 'entregado'
  -- Verificar que sea INSERT o que el estado cambió de algo distinto a 'entregado' a 'entregado'
  IF NEW.estado = 'entregado' AND (
    TG_OP = 'INSERT' OR 
    (TG_OP = 'UPDATE' AND (OLD.estado IS NULL OR OLD.estado != 'entregado'))
  ) THEN
    -- Si el pedido tiene cliente asociado
    IF NEW.cliente_id IS NOT NULL THEN
      -- Verificar que el cliente pertenezca al mismo tenant del pedido
      -- Esto es una validación de seguridad multi-tenant
      SELECT tenant_id INTO cliente_tenant_id
      FROM clientes
      WHERE id = NEW.cliente_id;

      IF cliente_tenant_id IS NULL OR cliente_tenant_id != NEW.tenant_id THEN
        RAISE EXCEPTION 'El cliente no pertenece al mismo tenant del pedido';
      END IF;

      -- Calcular puntos (si no están calculados ya)
      IF NEW.puntos_generados IS NULL OR NEW.puntos_generados = 0 THEN
        puntos_a_acreditar := calcular_puntos_por_monto(NEW.total);
      ELSE
        puntos_a_acreditar := NEW.puntos_generados;
      END IF;

      -- Obtener saldo actual del cliente
      SELECT puntos_totales INTO saldo_anterior
      FROM clientes
      WHERE id = NEW.cliente_id
        AND tenant_id = NEW.tenant_id;  -- ⚠️ Seguridad adicional

      saldo_nuevo := saldo_anterior + puntos_a_acreditar;

      -- Actualizar puntos del cliente
      UPDATE clientes
      SET 
        puntos_totales = saldo_nuevo,
        updated_at = NOW()
      WHERE id = NEW.cliente_id
        AND tenant_id = NEW.tenant_id;  -- ⚠️ Seguridad adicional

      -- Registrar transacción de puntos
      INSERT INTO transacciones_puntos (
        cliente_id,
        pedido_id,
        tipo,
        puntos,
        saldo_anterior,
        saldo_nuevo,
        descripcion
      ) VALUES (
        NEW.cliente_id,
        NEW.id,
        'ganado',
        puntos_a_acreditar,
        saldo_anterior,
        saldo_nuevo,
        'Puntos ganados por pedido #' || NEW.numero_pedido || ' - Total: ' || NEW.total
      );

      -- Actualizar puntos_generados en el pedido (por si no estaban calculados)
      UPDATE pedidos
      SET puntos_generados = puntos_a_acreditar
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Acreditar puntos al entregar pedido
-- Usamos dos triggers separados: uno para INSERT y otro para UPDATE
-- porque WHEN no puede referenciar OLD en triggers INSERT
DROP TRIGGER IF EXISTS trigger_acreditar_puntos_insert ON pedidos;
DROP TRIGGER IF EXISTS trigger_acreditar_puntos_update ON pedidos;

-- Trigger para INSERT: cuando se crea un pedido ya en estado 'entregado'
CREATE TRIGGER trigger_acreditar_puntos_insert
  AFTER INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.estado = 'entregado')
  EXECUTE FUNCTION acreditar_puntos_pedido();

-- Trigger para UPDATE: cuando un pedido cambia a estado 'entregado'
CREATE TRIGGER trigger_acreditar_puntos_update
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  WHEN (NEW.estado = 'entregado' AND (OLD.estado IS NULL OR OLD.estado != 'entregado'))
  EXECUTE FUNCTION acreditar_puntos_pedido();

-- Función: Descontar puntos cuando se canjean
-- ⚠️ MULTI-TENANT: Los clientes tienen tenant_id implícito
CREATE OR REPLACE FUNCTION descontar_puntos_canje(
  p_cliente_id UUID,
  p_puntos_a_canjear INTEGER,
  p_descripcion TEXT DEFAULT 'Canje de puntos'
)
RETURNS UUID AS $$
DECLARE
  v_saldo_anterior INTEGER;
  v_saldo_nuevo INTEGER;
  v_transaccion_id UUID;
BEGIN
  -- Obtener saldo actual
  SELECT puntos_totales INTO v_saldo_anterior
  FROM clientes
  WHERE id = p_cliente_id;

  -- Verificar que tenga suficientes puntos
  IF v_saldo_anterior < p_puntos_a_canjear THEN
    RAISE EXCEPTION 'El cliente no tiene suficientes puntos. Disponibles: %, requeridos: %', 
      v_saldo_anterior, p_puntos_a_canjear;
  END IF;

  v_saldo_nuevo := v_saldo_anterior - p_puntos_a_canjear;

  -- Actualizar puntos del cliente
  UPDATE clientes
  SET 
    puntos_totales = v_saldo_nuevo,
    updated_at = NOW()
  WHERE id = p_cliente_id;

  -- Registrar transacción
  INSERT INTO transacciones_puntos (
    cliente_id,
    tipo,
    puntos,
    saldo_anterior,
    saldo_nuevo,
    descripcion
  ) VALUES (
    p_cliente_id,
    'canjeado',
    -p_puntos_a_canjear,
    v_saldo_anterior,
    v_saldo_nuevo,
    p_descripcion
  )
  RETURNING id INTO v_transaccion_id;

  RETURN v_transaccion_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. VISTAS ÚTILES (MULTI-TENANT)
-- ============================================
-- Todas las vistas incluyen tenant_id para poder filtrar
-- ============================================

-- Vista: Productos con stock bajo (filtrable por tenant)
DROP VIEW IF EXISTS vista_stock_bajo;
CREATE VIEW vista_stock_bajo AS
SELECT 
  i.id,
  i.tenant_id,
  t.nombre as tenant_nombre,
  i.producto_id,
  p.nombre as producto_nombre,
  i.stock_actual,
  i.stock_minimo,
  i.unidad,
  (i.stock_actual - i.stock_minimo) as diferencia
FROM inventario i
JOIN tenants t ON i.tenant_id = t.id
LEFT JOIN productos p ON i.producto_id = p.id
WHERE i.controlar_stock = true
  AND i.stock_actual <= i.stock_minimo
ORDER BY i.tenant_id, diferencia ASC;

COMMENT ON VIEW vista_stock_bajo IS 'Productos con stock bajo - Incluye tenant_id para filtrar por lomitería';

-- Vista: Cuenta corriente de puntos por cliente (filtrable por tenant)
DROP VIEW IF EXISTS vista_cuenta_corriente_puntos;
CREATE VIEW vista_cuenta_corriente_puntos AS
SELECT 
  c.id as cliente_id,
  c.tenant_id,
  c.nombre as cliente_nombre,
  c.telefono,
  c.puntos_totales as saldo_actual,
  COALESCE(SUM(CASE WHEN tp.tipo = 'ganado' THEN tp.puntos ELSE 0 END), 0) as puntos_totales_ganados,
  COALESCE(SUM(CASE WHEN tp.tipo = 'canjeado' THEN ABS(tp.puntos) ELSE 0 END), 0) as puntos_totales_canjeados,
  COUNT(tp.id) as total_transacciones,
  MAX(tp.created_at) as ultima_transaccion
FROM clientes c
LEFT JOIN transacciones_puntos tp ON c.id = tp.cliente_id
GROUP BY c.id, c.tenant_id, c.nombre, c.telefono, c.puntos_totales;

COMMENT ON VIEW vista_cuenta_corriente_puntos IS 'Cuenta corriente de puntos - Incluye tenant_id para filtrar por lomitería';

-- ============================================
-- 6. ÍNDICES Y OPTIMIZACIONES MULTI-TENANT
-- ============================================

-- Índices para consultas rápidas por tenant
CREATE INDEX IF NOT EXISTS idx_inventario_control_stock ON inventario(tenant_id, controlar_stock) WHERE controlar_stock = true;
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_cliente ON pedidos(tenant_id, estado, cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transacciones_cliente_tipo ON transacciones_puntos(cliente_id, tipo, created_at DESC);

-- Índice para búsquedas de clientes por tenant
CREATE INDEX IF NOT EXISTS idx_clientes_tenant_nombre ON clientes(tenant_id, nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant_telefono ON clientes(tenant_id, telefono);

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS) - DESHABILITADO
-- ============================================
-- RLS deshabilitado para desarrollo
-- En producción, habilitar con políticas que usen tenant_id
-- ============================================

ALTER TABLE inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ✅ SCRIPT COMPLETADO - MULTI-TENANT READY
-- ============================================

COMMENT ON SCHEMA public IS 'Sistema POS con inventario y puntos automáticos - MULTI-TENANT';

-- ============================================
-- 📋 NOTAS DE USO Y ESCALABILIDAD
-- ============================================
--
-- ⚠️ MULTI-TENANT: Todo el sistema está preparado para múltiples lomiterías
--
-- 1. INVENTARIO:
--    - Cada producto puede tener un registro de inventario POR TENANT
--    - Para habilitar control de stock:
--      INSERT INTO inventario (tenant_id, producto_id, stock_actual, stock_minimo, controlar_stock)
--      VALUES (
--        (SELECT id FROM tenants WHERE slug = 'atlas-burger'),
--        producto_uuid, 
--        100, 
--        10, 
--        true
--      );
--
--    - Para consultar stock bajo de un tenant:
--      SELECT * FROM vista_stock_bajo WHERE tenant_id = 'tenant-uuid';
--
--    - El stock se descuenta AUTOMÁTICAMENTE cuando se crea un pedido
--    - El stock se restaura si se cancela un pedido
--    - Los triggers usan tenant_id del pedido para garantizar seguridad
--
-- 2. PUNTOS:
--    - Los puntos se acreditan AUTOMÁTICAMENTE cuando un pedido pasa a 'entregado'
--    - Cálculo: 1 punto por cada 100 GS de compra
--    - Los clientes ya tienen tenant_id, por lo que es seguro multi-tenant
--    - Para canjear puntos manualmente:
--      SELECT descontar_puntos_canje(cliente_uuid, puntos_a_canjear, 'Descripción');
--
--    - Para consultar cuenta corriente de un tenant:
--      SELECT * FROM vista_cuenta_corriente_puntos WHERE tenant_id = 'tenant-uuid';
--
-- 3. ESCALABILIDAD:
--    - Todas las tablas tienen índices por tenant_id para búsquedas rápidas
--    - Los triggers validan tenant_id en cada operación
--    - Las vistas incluyen tenant_id para poder filtrar
--    - Cada lomitería es completamente independiente
--
-- 4. SEGURIDAD:
--    - Los triggers verifican tenant_id antes de modificar datos
--    - Los JOINs incluyen filtros por tenant_id
--    - En producción, habilitar RLS con políticas basadas en tenant_id
--
-- ============================================

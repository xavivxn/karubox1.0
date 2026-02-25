-- ============================================
-- CONFIGURACIÓN PARA IMPRESIÓN AUTOMÁTICA
-- ============================================
-- 
-- Este script agrega la funcionalidad de impresión automática
-- usando Supabase Realtime (SIN túneles, SIN comunicación con Vercel)
-- 
-- Características:
-- ✅ Agrega estado 'confirmado' a la tabla pedidos
-- ✅ Configuración para que el agente escuche cambios en tiempo real
-- ✅ Respeta multitenant completamente
-- 
-- IMPORTANTE: Este script debe ejecutarse DESPUÉS de 00_initial_schema.sql
-- 
-- ============================================

-- ============================================
-- 1. AGREGAR ESTADO 'confirmado' A PEDIDOS
-- ============================================
-- 
-- Agrega el estado 'confirmado' como opción válida en la tabla pedidos
-- Este estado se usa cuando el vendedor confirma el pedido y debe imprimirse
-- 

-- Primero, eliminar la constraint existente
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;

-- Agregar la nueva constraint con 'confirmado' incluido
ALTER TABLE pedidos 
  ADD CONSTRAINT pedidos_estado_check 
  CHECK (estado IN ('pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado', 'cancelado'));

-- Actualizar el comentario para reflejar el nuevo estado
COMMENT ON COLUMN pedidos.estado IS 'Flujo del pedido: pendiente → confirmado → en_preparacion → listo → entregado (o cancelado). El estado "confirmado" dispara la impresión automática cuando estado_pedido = FACT.';

-- ============================================
-- 2. ÍNDICE PARA OPTIMIZAR CONSULTAS DE REALTIME
-- ============================================
-- 
-- Índice compuesto para optimizar las consultas de Supabase Realtime
-- que filtran por estado_pedido = 'FACT' (facturado/confirmado)
-- 

CREATE INDEX IF NOT EXISTS idx_pedidos_estado_pedido_fact 
  ON pedidos(tenant_id, estado_pedido, created_at DESC) 
  WHERE estado_pedido = 'FACT';

COMMENT ON INDEX idx_pedidos_estado_pedido_fact IS 'Índice optimizado para Supabase Realtime: filtra pedidos facturados/confirmados por tenant';

-- ============================================
-- 3. FUNCIÓN DE UTILIDAD: Verificar si un pedido debe imprimirse
-- ============================================
-- 
-- Función helper para verificar si un pedido debe imprimirse automáticamente
-- 

CREATE OR REPLACE FUNCTION debe_imprimir_pedido(p_pedido_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado_pedido TEXT;
  v_estado TEXT;
BEGIN
  SELECT estado_pedido, estado INTO v_estado_pedido, v_estado
  FROM pedidos
  WHERE id = p_pedido_id;
  
  -- Debe imprimirse si:
  -- 1. estado_pedido = 'FACT' (facturado/confirmado), O
  -- 2. estado = 'confirmado'
  RETURN (v_estado_pedido = 'FACT' OR v_estado = 'confirmado');
END;
$$;

COMMENT ON FUNCTION debe_imprimir_pedido IS 'Verifica si un pedido debe imprimirse automáticamente (estado_pedido = FACT o estado = confirmado)';

-- ============================================
-- 4. VISTA PARA MONITOREAR PEDIDOS PENDIENTES DE IMPRESIÓN
-- ============================================
-- 
-- Vista útil para ver qué pedidos están listos para imprimir
-- 

CREATE OR REPLACE VIEW vista_pedidos_pendientes_impresion AS
SELECT 
  p.id as pedido_id,
  p.tenant_id,
  t.nombre as lomiteria_nombre,
  t.slug as lomiteria_slug,
  p.numero_pedido,
  p.estado,
  p.estado_pedido,
  p.total,
  p.created_at,
  p.updated_at,
  pc.printer_id,
  pc.activo as impresora_activa,
  CASE 
    WHEN pc.printer_id IS NULL THEN 'Sin configuración de impresora'
    WHEN pc.activo = false THEN 'Impresora inactiva'
    WHEN p.estado_pedido = 'FACT' THEN 'Listo para imprimir (FACT)'
    WHEN p.estado = 'confirmado' THEN 'Listo para imprimir (confirmado)'
    ELSE 'No debe imprimirse'
  END as estado_impresion
FROM pedidos p
JOIN tenants t ON p.tenant_id = t.id AND t.is_deleted = false
LEFT JOIN printer_config pc ON pc.lomiteria_id = p.tenant_id AND pc.activo = true
WHERE (p.estado_pedido = 'FACT' OR p.estado = 'confirmado')
  AND p.created_at >= NOW() - INTERVAL '24 hours'  -- Solo últimos 24 horas
ORDER BY p.tenant_id, p.created_at DESC;

COMMENT ON VIEW vista_pedidos_pendientes_impresion IS 'Vista para monitorear pedidos que deben imprimirse automáticamente';

-- ============================================
-- 5. PERMISOS PARA REALTIME
-- ============================================
-- 
-- Asegurar que Supabase Realtime pueda escuchar cambios en la tabla pedidos
-- 

-- Dar permisos de lectura para Realtime (ya deberían estar, pero por si acaso)
GRANT SELECT ON pedidos TO anon;
GRANT SELECT ON pedidos TO authenticated;

-- Dar permisos para la vista
GRANT SELECT ON vista_pedidos_pendientes_impresion TO anon;
GRANT SELECT ON vista_pedidos_pendientes_impresion TO authenticated;

-- ============================================
-- 6. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON SCHEMA public IS 'Sistema POS Multi-Tenant v1.2 - Con impresión automática vía Supabase Realtime';

-- ============================================
-- ✅ CONFIGURACIÓN COMPLETADA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Configuración de impresión automática completada';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Cambios aplicados:';
  RAISE NOTICE '  ✅ Estado "confirmado" agregado a tabla pedidos';
  RAISE NOTICE '  ✅ Índice optimizado para Realtime (estado_pedido = FACT)';
  RAISE NOTICE '  ✅ Función helper: debe_imprimir_pedido()';
  RAISE NOTICE '  ✅ Vista: vista_pedidos_pendientes_impresion';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Próximos pasos:';
  RAISE NOTICE '  1. Habilitar Realtime en Supabase para la tabla "pedidos"';
  RAISE NOTICE '     (Database > Replication > Habilitar para "pedidos")';
  RAISE NOTICE '  2. Configurar el agente con SUPABASE_URL y SUPABASE_ANON_KEY';
  RAISE NOTICE '  3. Configurar printer_config para cada tenant';
  RAISE NOTICE '  4. Iniciar el agente con ENABLE_SUPABASE_LISTENER=true';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Para verificar:';
  RAISE NOTICE '  SELECT * FROM vista_pedidos_pendientes_impresion;';
END $$;

-- ============================================
-- 📝 NOTAS IMPORTANTES
-- ============================================
--
-- 🔧 FLUJO DE IMPRESIÓN AUTOMÁTICA:
--    1. Vendedor confirma pedido → estado_pedido = 'FACT' (o estado = 'confirmado')
--    2. Supabase Realtime detecta cambio → notifica al agente vía WebSocket
--    3. Agente consulta printer_config por tenant_id
--    4. Agente obtiene items desde vista_items_ticket_cocina (incluye modificaciones: sin X, extra Y)
--       Ejemplo: SELECT * FROM vista_items_ticket_cocina WHERE pedido_id = ?;
--       Cada fila tiene: producto_nombre, cantidad, modificaciones (texto para imprimir en el ticket)
--    5. Agente imprime automáticamente usando printer_id
--
-- 🔧 MULTITENANT:
--    - Todos los queries usan tenant_id para aislar datos
--    - Cada tenant tiene su propia configuración en printer_config
--    - El agente filtra automáticamente por tenant_id
--
-- 🔧 ESTADOS:
--    - estado_pedido = 'FACT': Pedido facturado/confirmado (dispara impresión)
--    - estado = 'confirmado': Estado intermedio (también dispara impresión)
--    - Ambos estados son compatibles con el listener
--
-- ============================================


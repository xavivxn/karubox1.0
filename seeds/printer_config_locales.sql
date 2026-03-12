-- ============================================
-- Configuración de impresora para el local
-- lomiteria_id = 10794121-1e82-4185-8966-c7d00ae1e82b
-- ============================================
-- Sin esta fila, el agente no sabe a qué impresora enviar el ticket
-- y la consulta devuelve 0 rows → PGRST116 → no imprime.
--
-- IMPORTANTE: Cambiá agent_ip por la IP o URL donde corre tu agente
-- (ej: 192.168.1.100 en red local, o una URL si usás túnel).
-- ============================================

INSERT INTO public.printer_config (
  lomiteria_id,
  printer_id,
  agent_ip,
  agent_port,
  tipo_impresora,
  nombre_impresora,
  ubicacion,
  activo
) VALUES (
  '10794121-1e82-4185-8966-c7d00ae1e82b',
  'lomiteria-10794121-printer-1',
  '127.0.0.1',
  3001,
  'usb',
  'Ticket Cocina',
  'Cocina',
  true
)
ON CONFLICT (lomiteria_id) DO UPDATE SET
  printer_id = EXCLUDED.printer_id,
  agent_ip = EXCLUDED.agent_ip,
  agent_port = EXCLUDED.agent_port,
  activo = EXCLUDED.activo,
  updated_at = now();

-- Verificar:
-- SELECT * FROM printer_config WHERE lomiteria_id = '10794121-1e82-4185-8966-c7d00ae1e82b';

-- =============================================================================
-- 35_retencion_print_trace_events.sql — conserva 14 días de trazas de impresión.
-- Corre todos los días a las 07:15 UTC (04:15 en Asunción) con pg_cron.
-- Aplicada en prod el 2026-11-03 (la primera limpieza borró 174.420 filas).
-- Rollback: SELECT cron.unschedule('limpiar_print_trace_events');
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'limpiar_print_trace_events';

SELECT cron.schedule(
  'limpiar_print_trace_events',
  '15 7 * * *',
  $$DELETE FROM public.print_trace_events WHERE ts < now() - interval '14 days'$$
);

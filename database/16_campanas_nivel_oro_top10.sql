-- Permitir tipos de campaña VIP: nivel_oro y top10_gasto
-- Ejecutar en Supabase SQL Editor después del script 12_cumpleanos_clientes.sql

ALTER TABLE campanas_envios DROP CONSTRAINT IF EXISTS campanas_envios_tipo_check;
ALTER TABLE campanas_envios ADD CONSTRAINT campanas_envios_tipo_check
  CHECK (tipo IN ('inactivos_15', 'inactivos_30', 'personalizado', 'cumpleanos', 'nivel_oro', 'top10_gasto'));


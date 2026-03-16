-- Campaña de cumpleaños: fecha_nacimiento en clientes + campos en campanas_config
-- Ejecutar en Supabase SQL Editor después de 09_campanas_clientes.sql

-- 1. Agregar fecha_nacimiento a clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

-- 2. Agregar campos birthday a campanas_config
ALTER TABLE campanas_config
  ADD COLUMN IF NOT EXISTS auto_cumpleanos BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_wa_cumpleanos TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS puntos_regalo_cumpleanos INTEGER DEFAULT 0;

-- 3. Permitir tipo 'cumpleanos' en log de campañas
ALTER TABLE campanas_envios DROP CONSTRAINT IF EXISTS campanas_envios_tipo_check;
ALTER TABLE campanas_envios ADD CONSTRAINT campanas_envios_tipo_check
  CHECK (tipo IN ('inactivos_15', 'inactivos_30', 'personalizado', 'cumpleanos'));

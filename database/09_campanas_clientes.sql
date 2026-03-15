-- ============================================
-- CAMPAÑAS DE FIDELIZACIÓN - PANEL DE CLIENTES
-- Version: 1.0
-- ============================================
-- Este script agrega:
--   1. Vista: clientes con última visita calculada
--   2. Tabla: campanas_config (config por tenant)
--   3. Tabla: campanas_envios (log de campañas)
--   4. Función: regalar_puntos_campana (batch gift points)
-- ============================================

-- ============================================
-- 1. VISTA: clientes con última visita
-- ============================================
-- Usa GROUP BY c.id (PK) para poder hacer SELECT c.*
-- sin listar todas las columnas en GROUP BY

DROP VIEW IF EXISTS vista_clientes_con_ultima_visita;
CREATE VIEW vista_clientes_con_ultima_visita AS
SELECT
  c.*,
  MAX(p.created_at)            AS ultima_visita,
  COUNT(p.id)                  AS total_pedidos,
  COALESCE(SUM(p.total), 0)   AS total_gastado
FROM clientes c
LEFT JOIN pedidos p
  ON  p.cliente_id  = c.id
  AND p.tenant_id   = c.tenant_id
  AND p.estado_pedido = 'FACT'
WHERE c.is_deleted = false
GROUP BY c.id;

COMMENT ON VIEW vista_clientes_con_ultima_visita IS
  'Clientes activos con última visita (pedido FACT), total pedidos y total gastado por cliente.';

GRANT SELECT ON vista_clientes_con_ultima_visita TO anon;
GRANT SELECT ON vista_clientes_con_ultima_visita TO authenticated;

-- ============================================
-- 2. TABLA: campanas_config
-- ============================================
CREATE TABLE IF NOT EXISTS campanas_config (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Switches de automatización
  auto_15_dias               BOOLEAN NOT NULL DEFAULT false,
  auto_30_dias               BOOLEAN NOT NULL DEFAULT false,

  -- Templates de WhatsApp
  template_wa_15dias         TEXT NOT NULL DEFAULT
    E'Hola {{nombre_cliente}} \uD83D\uDC4B\n\nEn {{nombre_lomiteria}} te extrañamos. Hace {{dias_inactivo}} días que no pasás por acá.\n\nTenés *{{puntos}} puntos* esperándote. Para que vuelvas con más ganas, te regalamos *{{puntos_regalo}} puntos* si venís esta semana.\n\n¿Cuándo nos visitás? \uD83C\uDF54',

  template_wa_30dias         TEXT NOT NULL DEFAULT
    E'Hola {{nombre_cliente}} \uD83D\uDC4B\n\nHace {{dias_inactivo}} días que no te vemos en {{nombre_lomiteria}}. ¡Queremos que vuelvas!\n\nTu saldo: *{{puntos}} puntos*. Como regalo por ser parte de nosotros, te acreditamos *{{puntos_regalo}} puntos* solo por pasar esta quincena.\n\nTe esperamos \uD83E\uDDE1',

  template_wa_personalizado  TEXT NOT NULL DEFAULT
    E'Hola {{nombre_cliente}} \uD83D\uDC4B\n\n{{mensaje_personalizado}}\n\nTu saldo actual: *{{puntos}} puntos*.\n\n— {{nombre_lomiteria}}',

  -- Puntos regalo por tipo de campaña
  puntos_regalo_15dias       INTEGER NOT NULL DEFAULT 0 CHECK (puntos_regalo_15dias >= 0),
  puntos_regalo_30dias       INTEGER NOT NULL DEFAULT 0 CHECK (puntos_regalo_30dias >= 0),
  puntos_regalo_personalizado INTEGER NOT NULL DEFAULT 0 CHECK (puntos_regalo_personalizado >= 0),

  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id)
);

COMMENT ON TABLE campanas_config IS
  'Configuración de campañas de fidelización por tenant: switches de automatización, templates WhatsApp y puntos regalo.';

CREATE INDEX IF NOT EXISTS idx_campanas_config_tenant ON campanas_config(tenant_id);

ALTER TABLE campanas_config DISABLE ROW LEVEL SECURITY;
GRANT ALL ON campanas_config TO anon;
GRANT ALL ON campanas_config TO authenticated;

-- ============================================
-- 3. TABLA: campanas_envios (log)
-- ============================================
CREATE TABLE IF NOT EXISTS campanas_envios (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo                          TEXT NOT NULL CHECK (tipo IN ('inactivos_15', 'inactivos_30', 'personalizado')),
  total_destinatarios           INTEGER NOT NULL DEFAULT 0,
  puntos_regalados_por_cliente  INTEGER NOT NULL DEFAULT 0,
  puntos_regalados_total        INTEGER NOT NULL DEFAULT 0,
  mensaje                       TEXT,
  created_at                    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE campanas_envios IS
  'Log de campañas de fidelización lanzadas por tenant: tipo, destinatarios, puntos regalados y mensaje.';

CREATE INDEX IF NOT EXISTS idx_campanas_envios_tenant ON campanas_envios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campanas_envios_fecha  ON campanas_envios(tenant_id, created_at DESC);

ALTER TABLE campanas_envios DISABLE ROW LEVEL SECURITY;
GRANT ALL ON campanas_envios TO anon;
GRANT ALL ON campanas_envios TO authenticated;

-- ============================================
-- 4. FUNCIÓN: regalar_puntos_campana
-- ============================================
-- Acredita puntos a múltiples clientes en un solo call.
-- Registra una transacción por cliente en transacciones_puntos.
-- Devuelve el número de clientes actualizados.

CREATE OR REPLACE FUNCTION regalar_puntos_campana(
  p_tenant_id   UUID,
  p_cliente_ids UUID[],
  p_puntos      INTEGER,
  p_descripcion TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id    UUID;
  v_saldo_anterior INTEGER;
  v_saldo_nuevo   INTEGER;
  v_count         INTEGER := 0;
BEGIN
  IF p_puntos <= 0 THEN
    RETURN 0;
  END IF;

  FOREACH v_cliente_id IN ARRAY p_cliente_ids
  LOOP
    SELECT puntos_totales INTO v_saldo_anterior
    FROM clientes
    WHERE id = v_cliente_id AND tenant_id = p_tenant_id AND is_deleted = false;

    IF FOUND THEN
      v_saldo_nuevo := v_saldo_anterior + p_puntos;

      UPDATE clientes
         SET puntos_totales = v_saldo_nuevo,
             updated_at     = NOW()
       WHERE id = v_cliente_id AND tenant_id = p_tenant_id;

      INSERT INTO transacciones_puntos (
        tenant_id, cliente_id, tipo, puntos, saldo_anterior, saldo_nuevo, descripcion
      ) VALUES (
        p_tenant_id, v_cliente_id, 'ajuste', p_puntos, v_saldo_anterior, v_saldo_nuevo, p_descripcion
      );

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION regalar_puntos_campana TO authenticated;
GRANT EXECUTE ON FUNCTION regalar_puntos_campana TO anon;

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ 09_campanas_clientes.sql ejecutado correctamente';
  RAISE NOTICE '  ✅ Vista: vista_clientes_con_ultima_visita';
  RAISE NOTICE '  ✅ Tabla: campanas_config';
  RAISE NOTICE '  ✅ Tabla: campanas_envios';
  RAISE NOTICE '  ✅ Función: regalar_puntos_campana';
END
$$;

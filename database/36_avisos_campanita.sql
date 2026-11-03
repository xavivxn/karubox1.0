-- =============================================================================
-- 36_avisos_campanita.sql — avisos de KarúBox para los locales (campanita del POS).
-- Aplicada en prod el 2026-11-03. Probada antes en un bloque revertido (7/7 OK).
--
-- - Los avisos los carga el equipo de KarúBox (service_role o SQL): ver
--   docs/runbooks/publicar-aviso-campanita.md
-- - Los usuarios del local (admin, cajero) solo LEEN los avisos vigentes globales o de
--   su local, y solo marcan como vistos los suyos (RLS).
-- - Se borran solos a los 10 días: la política oculta lo vencido y pg_cron lo elimina.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL CHECK (length(trim(titulo)) > 0),
  cuerpo text NOT NULL CHECK (length(trim(cuerpo)) > 0),
  tipo text NOT NULL DEFAULT 'actualizacion',
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL = todos los locales
  publicado_at timestamptz NOT NULL DEFAULT now(),
  expira_at timestamptz NOT NULL DEFAULT (now() + interval '10 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_avisos_vigentes ON public.avisos (expira_at, publicado_at DESC);
COMMENT ON TABLE public.avisos IS 'Avisos de KarúBox a los locales (campanita). tenant_id NULL = todos. Se borran solos al vencer expira_at.';

CREATE TABLE IF NOT EXISTS public.avisos_vistos (
  aviso_id uuid NOT NULL REFERENCES public.avisos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  visto_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (aviso_id, usuario_id)
);
CREATE INDEX IF NOT EXISTS idx_avisos_vistos_usuario ON public.avisos_vistos (usuario_id);
COMMENT ON TABLE public.avisos_vistos IS 'Qué usuario ya abrió cada aviso (el tilde de visto de la campanita).';

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_vistos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.avisos, public.avisos_vistos FROM anon, authenticated;
GRANT SELECT ON public.avisos TO authenticated;
GRANT SELECT, INSERT ON public.avisos_vistos TO authenticated;
GRANT ALL ON public.avisos, public.avisos_vistos TO service_role;

DROP POLICY IF EXISTS avisos_select_vigentes ON public.avisos;
CREATE POLICY avisos_select_vigentes ON public.avisos FOR SELECT TO authenticated USING (
  expira_at > now() AND publicado_at <= now()
  AND (tenant_id IS NULL OR tenant_id IN (
    SELECT u.tenant_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid() AND u.is_deleted = false))
);

DROP POLICY IF EXISTS avisos_vistos_select_propios ON public.avisos_vistos;
CREATE POLICY avisos_vistos_select_propios ON public.avisos_vistos FOR SELECT TO authenticated USING (
  usuario_id IN (SELECT u.id FROM public.usuarios u WHERE u.auth_user_id = auth.uid() AND u.is_deleted = false)
);

DROP POLICY IF EXISTS avisos_vistos_insert_propios ON public.avisos_vistos;
CREATE POLICY avisos_vistos_insert_propios ON public.avisos_vistos FOR INSERT TO authenticated WITH CHECK (
  usuario_id IN (SELECT u.id FROM public.usuarios u WHERE u.auth_user_id = auth.uid() AND u.is_deleted = false)
);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'borrar_avisos_vencidos';
SELECT cron.schedule('borrar_avisos_vencidos', '20 7 * * *', $$DELETE FROM public.avisos WHERE expira_at < now()$$);

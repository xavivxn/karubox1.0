-- =============================================================================
-- 34_seguridad_fase1.sql — Auditoría 2026-11-03, Fase 1 (segura en caliente)
-- No activa RLS ni toca ninguna lectura (SELECT). Rollback: 34_seguridad_fase1_rollback.sql
--
-- 1) anon deja de poder escribir tablas. Evidencia (logs 48 h): con la anon key
--    solo se llama rpc/log_print_event (agente de impresión). printer_config queda igual.
-- 2) Guarda de escritura en usuarios y tenants (cierra la escalada cajero -> owner):
--    owner: todo | admin: datos básicos de SU local, sin cambiar rol/local/estado/slug |
--    cajero: nada | service_role / postgres / migraciones: sin control.
-- 3) RPCs: sin acceso anon; regalar_puntos_campana y get_pos_ventas_* verifican que
--    p_tenant_id sea el local del usuario. Las de numeración solo pierden anon porque
--    las usa el trigger que numera cada pedido (asignar_numero_pedido) como el cajero.
-- Probado el 2026-11-03 en prod dentro de un bloque revertido: 21/21 pruebas OK.
-- =============================================================================

BEGIN;

-- 1) anon sin escritura -------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
  public.clientes, public.productos, public.mesas, public.items_pedido,
  public.items_pedido_customizacion, public.mesa_eventos, public.mesa_reservas,
  public.mesa_uniones, public.mesa_union_items, public.movimientos_ingredientes,
  public.pedido_divisiones, public.campanas_config, public.campanas_envios
FROM anon;

-- TRUNCATE no lo usa la API ni la app.
REVOKE TRUNCATE ON TABLE
  public.usuarios, public.tenants, public.clientes, public.productos,
  public.campanas_config, public.campanas_envios
FROM authenticated;

-- 2) Guardas de escritura -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_escritura_usuarios()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_rol text; v_tenant uuid;
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  SELECT u.rol, u.tenant_id INTO v_rol, v_tenant FROM public.usuarios u
   WHERE u.auth_user_id = auth.uid() AND u.is_deleted = false LIMIT 1;
  IF v_rol = 'owner' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND v_rol = 'admin' THEN
    IF OLD.tenant_id = v_tenant
       AND NEW.tenant_id IS NOT DISTINCT FROM OLD.tenant_id
       AND NEW.rol IS NOT DISTINCT FROM OLD.rol
       AND NEW.auth_user_id IS NOT DISTINCT FROM OLD.auth_user_id
       AND NEW.email IS NOT DISTINCT FROM OLD.email
       AND NEW.activo IS NOT DISTINCT FROM OLD.activo
       AND NEW.is_deleted IS NOT DISTINCT FROM OLD.is_deleted
       AND NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at
       AND NEW.empleado_id IS NOT DISTINCT FROM OLD.empleado_id THEN
      RETURN NEW;
    END IF;
  END IF;
  RAISE EXCEPTION 'No autorizado para modificar usuarios' USING ERRCODE = '42501';
END;
$fn$;

CREATE OR REPLACE FUNCTION public.guard_escritura_tenants()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_rol text; v_tenant uuid;
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  SELECT u.rol, u.tenant_id INTO v_rol, v_tenant FROM public.usuarios u
   WHERE u.auth_user_id = auth.uid() AND u.is_deleted = false LIMIT 1;
  IF v_rol = 'owner' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND v_rol = 'admin' THEN
    IF OLD.id = v_tenant
       AND NEW.id = OLD.id
       AND NEW.slug IS NOT DISTINCT FROM OLD.slug
       AND NEW.activo IS NOT DISTINCT FROM OLD.activo
       AND NEW.is_deleted IS NOT DISTINCT FROM OLD.is_deleted
       AND NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at THEN
      RETURN NEW;
    END IF;
  END IF;
  RAISE EXCEPTION 'No autorizado para modificar este local' USING ERRCODE = '42501';
END;
$fn$;

DROP TRIGGER IF EXISTS trg_guard_escritura ON public.usuarios;
CREATE TRIGGER trg_guard_escritura BEFORE INSERT OR UPDATE OR DELETE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.guard_escritura_usuarios();
DROP TRIGGER IF EXISTS trg_guard_escritura ON public.tenants;
CREATE TRIGGER trg_guard_escritura BEFORE INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.guard_escritura_tenants();

-- 3) RPCs ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.regalar_puntos_campana(p_tenant_id uuid, p_cliente_ids uuid[], p_puntos integer, p_descripcion text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  v_cliente_id    UUID;
  v_saldo_anterior INTEGER;
  v_saldo_nuevo   INTEGER;
  v_count         INTEGER := 0;
BEGIN
  IF coalesce(auth.role(), '') IN ('anon', 'authenticated') AND NOT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.auth_user_id = auth.uid() AND u.tenant_id = p_tenant_id AND u.is_deleted = false
  ) THEN
    RAISE EXCEPTION 'No autorizado para este local' USING ERRCODE = '42501';
  END IF;

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
$fn$;
REVOKE EXECUTE ON FUNCTION public.regalar_puntos_campana(uuid, uuid[], integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.regalar_puntos_campana(uuid, uuid[], integer, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_pos_ventas_por_producto(p_tenant_id uuid)
RETURNS TABLE(producto_id uuid, total_cantidad bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
  SELECT ip.producto_id, SUM(ip.cantidad)::BIGINT
  FROM items_pedido ip
  INNER JOIN pedidos p ON p.id = ip.pedido_id
    AND p.tenant_id = p_tenant_id
    AND p.estado IS DISTINCT FROM 'cancelado'
  WHERE ip.producto_id IS NOT NULL
    AND (
      coalesce(auth.role(), '') NOT IN ('anon', 'authenticated')
      OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.tenant_id = p_tenant_id AND u.is_deleted = false)
    )
  GROUP BY ip.producto_id
$fn$;

CREATE OR REPLACE FUNCTION public.get_pos_ventas_por_categoria(p_tenant_id uuid)
RETURNS TABLE(categoria_id uuid, total_cantidad bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
  SELECT pr.categoria_id, COALESCE(SUM(ip.cantidad), 0)::BIGINT
  FROM productos pr
  LEFT JOIN items_pedido ip ON ip.producto_id = pr.id
  LEFT JOIN pedidos p ON p.id = ip.pedido_id
    AND p.tenant_id = p_tenant_id
    AND p.estado IS DISTINCT FROM 'cancelado'
  WHERE pr.tenant_id = p_tenant_id
    AND (pr.is_deleted IS NOT TRUE)
    AND pr.categoria_id IS NOT NULL
    AND (
      coalesce(auth.role(), '') NOT IN ('anon', 'authenticated')
      OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.tenant_id = p_tenant_id AND u.is_deleted = false)
    )
  GROUP BY pr.categoria_id
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_pos_ventas_por_producto(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_pos_ventas_por_categoria(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pos_ventas_por_producto(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_pos_ventas_por_categoria(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.obtener_siguiente_numeracion_pedido(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_siguiente_numeracion_pedido(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.obtener_siguiente_numero_pedido(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_siguiente_numero_pedido(uuid) TO authenticated, service_role;

COMMIT;

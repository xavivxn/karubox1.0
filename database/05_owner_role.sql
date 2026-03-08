-- ============================================================
-- Migration 05: Rol owner + tenant sistema
-- Aplicar en Supabase SQL Editor
-- ============================================================

-- 1. Ampliar CHECK constraint de rol en tabla usuarios
--    (eliminar el actual y crear uno nuevo que incluye 'owner')
ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS usuarios_rol_check;

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('owner', 'admin', 'cajero', 'cocinero', 'repartidor'));

-- 2. Actualizar el COMMENT para documentar el nuevo rol
COMMENT ON COLUMN usuarios.rol IS
  'owner: dueño del sistema/plataforma, admin: dueño del local, cajero: POS, cocinero: KDS, repartidor: delivery';

-- 3. Crear el tenant "sistema" al que pertenece el usuario owner
--    (ID fijo para poder referenciarlo fácilmente)
INSERT INTO tenants (id, nombre, slug, activo, is_deleted)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Sistema',
  'sistema',
  true,
  false
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
INSTRUCCIONES POST-MIGRATION para crear el usuario owner:

Paso 1: Ir a Supabase Dashboard → Authentication → Users
        → Invite user (o Add user) con el email del owner.
        Anotar el UUID generado por Supabase.

Paso 2: Ejecutar el siguiente INSERT reemplazando los valores:

INSERT INTO usuarios (auth_user_id, tenant_id, email, nombre, rol, activo, is_deleted)
VALUES (
  'cf6c32ea-2452-4612-bcc6-a2ecac93666f',
  '00000000-0000-0000-0000-000000000001',
  'ardentium_owner@gmail.com',
  'Owner',
  'owner',
  true,
  false
);
-- ============================================================

# 🚀 Migración a Multi-Tenant

## ¿Qué cambia?

Tu sistema ahora soporta **múltiples lomiterías** en una sola instalación.

---

## PASO 1: Ejecutar el nuevo schema en Supabase

### 1. Ve a tu proyecto en Supabase
- Dashboard: https://supabase.com/dashboard

### 2. Abre el SQL Editor
- Menú lateral → SQL Editor → New Query

### 3. Copia TODO el contenido de `database-multitenant.sql`
- Abrir archivo `database-multitenant.sql`
- Copiar todo (Ctrl+A, Ctrl+C)
- Pegar en Supabase SQL Editor

### 4. Ejecutar
- Click en "Run" (o F5)
- Esperar que termine (puede tardar 10-15 segundos)
- ✅ Deberías ver: "Success. No rows returned"

---

## PASO 2: Verificar que se creó todo

### En Supabase, ve a "Table Editor" y verifica:

```
✅ tenants
✅ usuarios
✅ categorias (con tenant_id)
✅ productos (con tenant_id)
✅ clientes (con tenant_id)
✅ pedidos (con tenant_id)
✅ items_pedido
✅ transacciones_puntos
✅ promociones (con tenant_id)
```

### Datos de ejemplo:
- 2 tenants: "Lomitería Don Juan" y "El Lomito de la Esquina"
- Categorías y productos para cada uno
- Clientes de ejemplo

---

## PASO 3: Crear tu primer usuario

### Opción A: Desde Supabase Dashboard

1. Ve a **Authentication** → **Users**
2. Click en **"Add user"**
3. Crear usuario:
   - Email: `admin@lomiteria-don-juan.com`
   - Password: `Admin123!` (temporal)
   - ✅ "Auto Confirm User": ON

4. **Copiar el User ID** (UUID que aparece)

5. Ve a **Table Editor** → **usuarios** → **Insert** → **Insert row**
   ```
   tenant_id: (Copiar ID de "Lomitería Don Juan" desde tabla tenants)
   auth_user_id: (El UUID que copiaste del usuario)
   email: admin@lomiteria-don-juan.com
   nombre: Admin Don Juan
   rol: admin
   activo: true
   ```

### Opción B: Desde SQL

```sql
-- 1. Primero crear usuario en Supabase Auth (desde Dashboard)
-- 2. Luego vincularlo:

INSERT INTO usuarios (tenant_id, auth_user_id, email, nombre, rol)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'lomiteria-don-juan'),
  'UUID-DEL-USUARIO-AUTH', -- Reemplazar con el UUID real
  'admin@lomiteria-don-juan.com',
  'Admin Don Juan',
  'admin'
);
```

---

## PASO 4: Configurar Supabase Auth

### En Supabase Dashboard:

1. **Authentication** → **Settings** → **Auth Providers**

2. **Email Auth:**
   - ✅ Enable Email provider
   - ✅ Confirm email: **OFF** (para desarrollo)
   - ✅ Enable email confirmations: **OFF** (para desarrollo)

3. **URL Configuration:**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

4. **JWT Settings:** (dejar por defecto)

---

## PASO 5: Actualizar `.env.local`

Tu `.env.local` ya tiene las credenciales, **NO necesitas cambiar nada**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zzyjmcjrjtfudginsvin.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

---

## Próximos pasos

Ahora vamos a crear:
1. ✅ Pantalla de login
2. ✅ Middleware de protección
3. ✅ Hook `useTenant`
4. ✅ Refactorizar el POS actual

---

## Testing rápido

### Verifica que RLS funciona:

```sql
-- En SQL Editor, como usuario anónimo:
SELECT * FROM productos;
-- ❌ Debería dar 0 resultados (RLS bloqueando)

-- Como usuario autenticado:
-- ✅ Solo verá productos de su tenant
```

---

## Datos de ejemplo incluidos

### Tenant 1: Lomitería Don Juan
- Slug: `lomiteria-don-juan`
- 5 categorías
- 8 productos
- 3 clientes de ejemplo

### Tenant 2: El Lomito de la Esquina
- Slug: `lomito-esquina`
- 3 categorías
- 3 productos
- Sin clientes aún

---

## ¿Problemas?

### Error: "relation already exists"
- **Solución:** Las tablas ya existen. El script tiene `DROP TABLE IF EXISTS`, debería funcionar.

### Error: RLS policies
- **Solución:** Borrar policies existentes primero desde Table Editor → Policies

### No aparecen los datos de ejemplo
- **Solución:** Verificar en Table Editor que las tablas tengan datos

---

## ✅ Checklist

- [ ] Ejecuté `database-multitenant.sql` en Supabase
- [ ] Veo las 9 tablas en Table Editor
- [ ] Veo 2 tenants de ejemplo
- [ ] Creé mi primer usuario admin
- [ ] Vinculé el usuario con el tenant
- [ ] Configuré Supabase Auth
- [ ] Mi `.env.local` tiene las credenciales

**Una vez completado, continuar con el login** 🎯


# ✅ Pasos para Completar el Sistema de Clientes

## 📋 Lo que ya está hecho

1. ✅ Página de administración de clientes (`/admin/clientes`)
2. ✅ Funciones helper actualizadas con tenant_id
3. ✅ Formulario con CI, teléfono y nombre

## 🔧 Pasos para completar

### PASO 1: Agregar campo CI a la base de datos

**⏱️ Tiempo: 1 minuto**

Ejecuta en Supabase SQL Editor:

```sql
-- Abre el archivo: add-ci-clientes.sql
-- Copia y pega en Supabase
-- Ejecuta
```

Este script agrega el campo `ci` a la tabla `clientes`.

---

### PASO 2: Verificar que funciona

1. Inicia sesión en tu app
2. Ve a **Admin** → **Gestionar Clientes**
3. Click en **"Nuevo Cliente"**
4. Completa el formulario con:
   - Nombre: "Juan Pérez"
   - CI: "1234567"
   - Teléfono: "(0981) 123-456"
5. Click en **"Crear"**
6. ✅ Debe aparecer en la lista

---

### PASO 3: (Opcional) Actualizar ClientModal del POS

El `ClientModal.tsx` del POS también debería usar tenant_id. Esto lo podemos hacer después si quieres.

---

## ✅ Listo

Ahora puedes:
- ✅ Crear nuevos clientes desde Admin → Clientes
- ✅ Buscar clientes por nombre, CI o teléfono
- ✅ Editar clientes existentes
- ✅ Ver puntos de cada cliente
- ✅ Todo funciona con multi-tenant (solo ves clientes de tu lomitería)

---

**¿Ejecutaste el SQL para agregar el campo CI?** 🚀


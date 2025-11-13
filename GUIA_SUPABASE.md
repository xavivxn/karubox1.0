# 🗄️ Guía de Configuración de Supabase

## Paso 1: Crear Cuenta y Proyecto

### 1.1 Crear cuenta en Supabase

1. Ve a **https://supabase.com**
2. Click en **"Start your project"** o **"Sign up"**
3. Puedes registrarte con:
   - GitHub (recomendado)
   - Email

### 1.2 Crear nuevo proyecto

1. Una vez dentro del dashboard, click en **"New Project"**
2. Completa los datos:
   - **Name:** `Lomiteria POS` (o el nombre que prefieras)
   - **Database Password:** Genera una contraseña segura (guárdala en un lugar seguro)
   - **Region:** Selecciona la más cercana (ej: `South America (São Paulo)`)
   - **Pricing Plan:** Selecciona **Free** para empezar (incluye 500MB de DB y 1GB de storage)

3. Click en **"Create new project"**
4. Espera 1-2 minutos mientras se crea la base de datos

---

## Paso 2: Obtener Credenciales

Una vez creado el proyecto:

1. En el menú lateral, ve a **Settings** (⚙️ ícono de engranaje)
2. Click en **API**
3. Vas a ver:
   - **Project URL** - Algo como: `https://abcdefghijk.supabase.co`
   - **Project API keys:**
     - `anon` `public` (esta es la que usamos)
     - `service_role` (NO uses esta en el frontend)

4. **Copia estos dos valores:**
   ```
   Project URL: https://xxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
   ```

---

## Paso 3: Configurar Variables de Entorno

Estas credenciales las vas a usar en el archivo `.env.local` que vamos a crear.

---

## Paso 4: Crear Esquema de Base de Datos

1. En el menú lateral, ve a **SQL Editor** (ícono de base de datos con rayo)
2. Click en **"New query"**
3. Copia y pega el SQL que está en el archivo `database.sql`
4. Click en **"Run"** (o presiona `Ctrl + Enter`)
5. Deberías ver: ✅ **"Success. No rows returned"**

---

## Paso 5: Verificar Tablas Creadas

1. En el menú lateral, ve a **Table Editor** (ícono de tabla)
2. Deberías ver todas las tablas:
   - ✅ categorias
   - ✅ productos
   - ✅ clientes
   - ✅ pedidos
   - ✅ items_pedido
   - ✅ transacciones_puntos
   - ✅ promociones

3. Click en cada tabla para ver las columnas y los datos de ejemplo

---

## Paso 6: Habilitar Realtime

1. En el menú lateral, ve a **Database** → **Replication**
2. Busca la tabla **`pedidos`**
3. Activa el switch para habilitar Realtime
4. Repite para las tablas:
   - ✅ pedidos
   - ✅ items_pedido

Esto permite que el KDS (cocina) reciba actualizaciones en tiempo real.

---

## Paso 7: Configurar el Proyecto Local

Ahora volvemos a tu proyecto Next.js y configuramos las credenciales.

El archivo `.env.local` ya está creado con tus credenciales.

---

## ✅ Verificación

Para verificar que todo funciona:

1. Abre la consola del navegador en tu app (F12)
2. Ejecuta en la consola:
```javascript
// Esto lo vamos a poder hacer desde el código
const { data, error } = await supabase.from('productos').select('*')
console.log(data)
```

Si ves los productos, ¡todo funciona! 🎉

---

## 📊 Estructura de la Base de Datos

```
categorias
├── id (uuid)
├── nombre (varchar)
├── orden (integer)
└── activa (boolean)

productos
├── id (uuid)
├── nombre (varchar)
├── precio (decimal)
├── categoria_id (uuid) → categorias.id
└── disponible (boolean)

clientes
├── id (uuid)
├── telefono (varchar, unique)
├── nombre (varchar)
└── puntos_totales (integer)

pedidos
├── id (uuid)
├── numero_pedido (serial, auto-increment)
├── cliente_id (uuid) → clientes.id
├── tipo (delivery/local/takeaway)
├── estado (pendiente/preparando/listo/entregado)
├── total (decimal)
└── puntos_generados (integer)

items_pedido
├── id (uuid)
├── pedido_id (uuid) → pedidos.id
├── producto_id (uuid) → productos.id
├── cantidad (integer)
└── subtotal (decimal)

transacciones_puntos
├── id (uuid)
├── cliente_id (uuid) → clientes.id
├── tipo (ganado/canjeado/ajuste)
└── puntos (integer)

promociones
├── id (uuid)
├── nombre (varchar)
├── multiplicador (decimal)
├── dias_semana (array)
└── activa (boolean)
```

---

## 🔐 Seguridad

- ✅ Row Level Security (RLS) habilitado en todas las tablas
- ✅ Políticas básicas configuradas
- ⚠️ Por ahora todas permiten acceso público (para desarrollo)
- 🔒 Más adelante podemos agregar autenticación y permisos granulares

---

## 💡 Próximos Pasos

Una vez que tengas Supabase configurado:
1. ✅ Verifica que las tablas están creadas
2. ✅ Verifica que hay datos de ejemplo
3. ✅ Testa una query desde el código
4. 🚀 Empezamos a desarrollar el POS

---

## 🆘 Solución de Problemas

### Error: "relation does not exist"
- Verifica que ejecutaste el SQL completo
- Verifica que estás en el proyecto correcto

### Error: "invalid API key"
- Verifica que copiaste la `anon public` key
- Verifica que el archivo `.env.local` está en la raíz del proyecto
- Reinicia el servidor (`npm run dev`)

### No veo datos de ejemplo
- Verifica que ejecutaste la sección de INSERT del SQL
- Refresca la página del Table Editor

---

¡Listo! Con esto tenés Supabase completamente configurado. 🎉


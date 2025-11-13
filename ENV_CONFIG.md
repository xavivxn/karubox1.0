# 🔐 Configuración de Variables de Entorno

## Crear archivo `.env.local`

Crea un archivo llamado **`.env.local`** en la raíz del proyecto (`pos-lomiteria/.env.local`) con el siguiente contenido:

```env
# ============================================
# CONFIGURACIÓN DE SUPABASE
# ============================================

# Project URL - Obtenlo de Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Anon/Public Key - Obtenlo de Supabase → Settings → API
# ⚠️ USA LA KEY "anon public", NO la "service_role"
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu_key_completa_aqui
```

## 📝 Instrucciones Paso a Paso

### 1. Obtener Credenciales de Supabase

1. Ve a **https://supabase.com** y logueate
2. Selecciona tu proyecto (o crea uno nuevo siguiendo GUIA_SUPABASE.md)
3. En el menú lateral, click en **Settings** ⚙️
4. Click en **API**
5. Verás dos secciones importantes:

#### Project URL
```
https://xxxxxxxxxx.supabase.co
```
☝️ Copia esta URL completa

#### API Keys
Verás dos keys:
- ✅ **anon** / **public** ← **USA ESTA**
- ❌ **service_role** ← NO uses esta en el frontend

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```
☝️ Copia la key **anon/public** completa

### 2. Crear el archivo `.env.local`

**Opción A: Desde la terminal**
```bash
# Windows PowerShell
cd pos-lomiteria
New-Item -Path ".env.local" -ItemType File
notepad .env.local
```

**Opción B: Desde VS Code**
1. En la carpeta `pos-lomiteria`, click derecho
2. "New File"
3. Nómbralo exactamente: `.env.local`

### 3. Agregar las credenciales

Pega este contenido y reemplaza con tus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-aqui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu_key_real_aqui
```

### 4. Guardar y reiniciar

1. **Guarda el archivo** (Ctrl+S)
2. **Reinicia el servidor de desarrollo:**
   - En la terminal donde corre `npm run dev`, presiona `Ctrl+C`
   - Vuelve a ejecutar: `npm run dev`

## ✅ Verificar que funciona

Una vez que agregaste las credenciales, podés verificar que funciona:

1. Abre tu app en el navegador: http://localhost:3000
2. Abre la consola del navegador (F12)
3. En la pestaña Console, ejecuta:

```javascript
// Verificar conexión
const { data, error } = await fetch('/api/test-supabase')
console.log(data, error)
```

O desde el código TypeScript:

```typescript
import { supabase } from '@/lib/supabase'

// En cualquier componente
const { data, error } = await supabase.from('productos').select('*')
console.log(data) // Debería mostrar los productos
```

## ⚠️ Importante

### Seguridad
- ✅ El archivo `.env.local` ya está en el `.gitignore`
- ✅ NO subas este archivo a GitHub
- ✅ Cada desarrollador debe tener su propio `.env.local`
- ❌ NUNCA uses la `service_role` key en el frontend

### Troubleshooting

**Error: "Invalid API key"**
- Verifica que copiaste la key `anon/public`, no la `service_role`
- Verifica que no haya espacios extra al pegar
- Reinicia el servidor (Ctrl+C y `npm run dev`)

**Error: "supabaseUrl is required"**
- Verifica que el archivo se llame exactamente `.env.local`
- Verifica que esté en la raíz del proyecto (`pos-lomiteria/.env.local`)
- Verifica que las variables empiecen con `NEXT_PUBLIC_`
- Reinicia el servidor

**Las variables no se cargan**
- Asegurate de que el archivo se llame `.env.local` (con el punto al inicio)
- Reinicia completamente el servidor
- Verifica que no haya errores de sintaxis en el archivo

## 📦 Variables Adicionales (Opcional)

Si necesitás más configuraciones en el futuro:

```env
# URL base de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Modo debug
NEXT_PUBLIC_DEBUG=true

# Configuración de impresora (futuro)
# PRINTER_IP=192.168.1.100
# PRINTER_PORT=9100
```

## 🔄 Actualizar Credenciales

Si necesitás cambiar las credenciales:

1. Abre el archivo `.env.local`
2. Modifica los valores
3. Guarda el archivo
4. Reinicia el servidor (`Ctrl+C` y `npm run dev`)

---

**Una vez que tengas el archivo `.env.local` configurado, estás listo para usar Supabase en tu app!** 🚀


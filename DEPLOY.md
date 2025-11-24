# 🚀 Guía de Deployment Automático

Esta guía te muestra cómo configurar **auto-deploy** con Vercel para que cada `git push` despliegue automáticamente tu aplicación.

## 📋 Requisitos Previos

- ✅ Cuenta en [GitHub](https://github.com)
- ✅ Cuenta en [Vercel](https://vercel.com) (gratis)
- ✅ Proyecto ya subido a GitHub

---

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Verificar que Git está configurado

```bash
cd pos-lomiteria
git status
```

### 1.2 Si no tienes un repositorio remoto, créalo:

```bash
# Crear repo en GitHub (desde la web)
# Luego conectar:
git remote add origin https://github.com/TU_USUARIO/pos-lomiteria.git
git branch -M main
git push -u origin main
```

---

## 🌐 Paso 2: Conectar con Vercel

### 2.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en **"Sign Up"**
3. Elige **"Continue with GitHub"** (recomendado)
4. Autoriza Vercel a acceder a tus repos

### 2.2 Importar Proyecto

1. En el dashboard de Vercel, click en **"Add New..."** → **"Project"**
2. Selecciona tu repositorio `pos-lomiteria`
3. Vercel detectará automáticamente que es un proyecto Next.js

### 2.3 Configurar Variables de Entorno

**⚠️ IMPORTANTE:** Antes de hacer deploy, configura las variables de entorno:

1. En la pantalla de configuración del proyecto, busca **"Environment Variables"**
2. Agrega estas dos variables:

```
NEXT_PUBLIC_SUPABASE_URL
https://tu-proyecto.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu_key_completa
```

3. Selecciona los ambientes:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**

### 2.4 Configurar Build Settings

Vercel debería detectar automáticamente:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

Si no, configúralo manualmente.

### 2.5 Deploy

1. Click en **"Deploy"**
2. Espera 1-2 minutos mientras Vercel:
   - Instala dependencias
   - Hace build del proyecto
   - Despliega la aplicación

3. ✅ **¡Listo!** Tu app estará disponible en: `https://tu-proyecto.vercel.app`

---

## 🔄 Paso 3: Auto-Deploy Configurado

Una vez configurado, **cada vez que hagas `git push`**:

1. Vercel detectará el cambio automáticamente
2. Iniciará un nuevo build
3. Desplegará la nueva versión
4. Te enviará un email con el resultado

### Preview Deployments

- Cada **Pull Request** en GitHub crea un **preview deployment** único
- Útil para probar cambios antes de mergear a `main`
- URL tipo: `https://pos-lomiteria-git-branch-tu-usuario.vercel.app`

---

## 🔐 Paso 4: Obtener Credenciales de Supabase

Si aún no tienes las credenciales:

1. Ve a [supabase.com](https://supabase.com)
2. Selecciona tu proyecto
3. **Settings** → **API**
4. Copia:
   - **Project URL**
   - **anon public** key (NO la service_role)

---

## 📝 Paso 5: Verificar Deployment

### 5.1 Verificar que la app funciona

1. Abre la URL de Vercel: `https://tu-proyecto.vercel.app`
2. Deberías ver la pantalla de login
3. Intenta loguearte

### 5.2 Verificar logs

1. En Vercel Dashboard → **Deployments**
2. Click en el último deployment
3. Revisa los **Logs** si hay errores

---

## 🛠️ Troubleshooting

### Error: "Environment variables not found"

**Solución:**
1. Ve a Vercel Dashboard → **Settings** → **Environment Variables**
2. Verifica que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén configuradas
3. Asegúrate de que estén marcadas para **Production**, **Preview** y **Development**

### Error: "Build failed"

**Solución:**
1. Revisa los logs en Vercel
2. Verifica que `package.json` tenga todos los scripts necesarios
3. Asegúrate de que no haya errores de TypeScript (`npm run build` localmente)

### Error: "Supabase connection failed"

**Solución:**
1. Verifica que las variables de entorno en Vercel sean correctas
2. Verifica que no haya espacios extra al copiar/pegar
3. Asegúrate de usar la key **anon/public**, NO la service_role

### La app funciona local pero no en Vercel

**Solución:**
1. Verifica que `.env.local` no esté en el repo (debe estar en `.gitignore`)
2. Configura las variables en Vercel Dashboard
3. Haz un nuevo deploy después de agregar las variables

---

## 📊 Monitoreo

### Ver Deployments

- Vercel Dashboard → **Deployments**
- Verás el historial completo de todos los deploys

### Ver Analytics

- Vercel Dashboard → **Analytics**
- Métricas de rendimiento, visitas, etc.

### Ver Logs en Tiempo Real

- Vercel Dashboard → **Deployments** → Click en un deployment → **Logs**
- Útil para debuggear errores

---

## 🎯 Workflow Recomendado

### Desarrollo Local

```bash
# 1. Trabajar en tu código
git checkout -b feature/nueva-funcionalidad

# 2. Probar localmente
npm run dev

# 3. Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### Deploy Automático

1. **Crear Pull Request** en GitHub
   - Vercel crea un **preview deployment** automáticamente
   - Revisa el preview antes de mergear

2. **Mergear a `main`**
   - Vercel despliega automáticamente a **production**
   - La app en producción se actualiza

---

## ✅ Checklist de Deployment

Antes de hacer el primer deploy, verifica:

- [ ] Repositorio subido a GitHub
- [ ] Cuenta de Vercel creada
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] Build exitoso en Vercel
- [ ] App funcionando en la URL de Vercel
- [ ] Login funcionando correctamente

---

## 🎉 ¡Listo!

Ahora cada vez que hagas `git push`, tu aplicación se actualizará automáticamente en Vercel.

**URLs importantes:**
- **Production:** `https://tu-proyecto.vercel.app`
- **Dashboard:** `https://vercel.com/dashboard`
- **GitHub:** `https://github.com/TU_USUARIO/pos-lomiteria`

---

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js en Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)


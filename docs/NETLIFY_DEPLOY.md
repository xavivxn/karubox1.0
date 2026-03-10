# Deploy en Netlify

## 1. Publish directory (obligatorio)

El plugin `@netlify/plugin-nextjs` (OpenNext) **gestiona solo** el directorio de publicación. No le pongas valor en la UI.

- En Netlify: **Site configuration** → **Build & deploy** → **Build settings** → **Edit settings**.
- En **Publish directory**: dejalo **vacío** (borrá cualquier valor).
- Guardá. No pongas `.next`, ni `.netlify/output`, ni la raíz del repo: el plugin lo define internamente.

## 2. Variables de entorno (Supabase)

Para que la app conecte a Supabase en build y en runtime:

- **Site settings** → **Environment variables** → **Add a variable** (o **Import from .env**).
- Agregá (con los valores que usás en local):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Opcional: si usás service role u otras claves, añadilas también.
- Guardá y **trigger a new deploy** (Deploys → Trigger deploy).

No subas `.env.local` al repo; usá solo las variables en Netlify.

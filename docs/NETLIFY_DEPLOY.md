# Deploy en Netlify

## 1. Publish directory (obligatorio)

El plugin `@netlify/plugin-nextjs` **no acepta** que "Publish directory" sea la raíz del repo.

- En Netlify: **Site settings** → **Build & deploy** → **Continuous Deployment** → **Build settings** → **Edit settings**.
- En **Publish directory**: **dejalo vacío** (borrá cualquier valor, por ejemplo `/` o el path del repo).
- Guardá. El `netlify.toml` del repo ya define `publish = ".netlify/output"` para que el plugin funcione.

Si dejás Publish directory en blanco, Netlify usará el valor de `netlify.toml`. No lo pongas en la UI a la raíz del repo.

## 2. Variables de entorno (Supabase)

Para que la app conecte a Supabase en build y en runtime:

- **Site settings** → **Environment variables** → **Add a variable** (o **Import from .env**).
- Agregá (con los valores que usás en local):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Opcional: si usás service role u otras claves, añadilas también.
- Guardá y **trigger a new deploy** (Deploys → Trigger deploy).

No subas `.env.local` al repo; usá solo las variables en Netlify.

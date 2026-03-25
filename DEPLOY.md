# Despliegue en Vercel

1. Subí el repositorio a GitHub (u otro Git compatible con Vercel).
2. En [Vercel](https://vercel.com), importá el proyecto y dejá el framework **Next.js** detectado automáticamente.
3. Configurá las variables de entorno (ver sección **Preproducción (Supabase + Vercel)** en [README.md](./README.md)): en **Production** las credenciales del proyecto Supabase de producción; en **Preview** las del proyecto de staging.
4. Asigná tu dominio `.com.py` al despliegue de **Production** (rama principal).

Los detalles de base de datos de preproducción, Auth y orden de scripts SQL están en el README.

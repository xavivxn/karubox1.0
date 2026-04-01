import type { NextConfig } from "next";

/**
 * `distDir` debe quedar dentro del proyecto: si está fuera (p. ej. bajo AppData),
 * Webpack puede fallar al resolver `react/jsx-runtime` desde los bundles del servidor.
 *
 * El EPERM en `.next/trace` en Windows/OneDrive lo mitigamos con el parche de Next +
 * `NEXT_DISABLE_TRACE_FILE=1` en los scripts `dev` / `dev:no-open` (ver `patches/`).
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;

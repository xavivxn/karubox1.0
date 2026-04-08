import type { NextConfig } from "next";
import { getSupabaseUrl } from "./src/lib/env/supabase";

/**
 * `distDir` debe quedar dentro del proyecto: si está fuera (p. ej. bajo AppData),
 * Webpack puede fallar al resolver `react/jsx-runtime` desde los bundles del servidor.
 *
 * El EPERM en `.next/trace` en Windows/OneDrive lo mitigamos con el parche de Next +
 * `NEXT_DISABLE_TRACE_FILE=1` en los scripts `dev` / `dev:no-open` (ver `patches/`).
 */
const supabaseHost = (() => {
  try {
    return new URL(getSupabaseUrl()).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;

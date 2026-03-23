import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TenantProvider } from "@/contexts/TenantContext";
import { AppFrame } from "@/components/layout/AppFrame";

// Favicon temporal (emoji hamburguesa) para que el sitio tenga ícono en pestañas.
// En el futuro, reemplazá esta URL por tu favicon personalizado (idealmente un archivo en `public/`):
// - favicon: "/favicon.ico"
// - apple: "/apple-touch-icon.png"
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#111827"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-size="40">&#x1F354;</text>
</svg>`;
const faviconDataUri = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

export const metadata: Metadata = {
  title: "KarúBox - Plataforma POS",
  description: "KarúBox unifica ventas, caja e inventario en un solo panel multi-tenant.",
  icons: {
    icon: faviconDataUri,
    apple: faviconDataUri,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full">
        <TenantProvider>
          <AppFrame>{children}</AppFrame>
        </TenantProvider>
      </body>
    </html>
  );
}


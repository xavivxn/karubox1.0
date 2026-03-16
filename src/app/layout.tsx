import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TenantProvider } from "@/contexts/TenantContext";
import { AppFrame } from "@/components/layout/AppFrame";

export const metadata: Metadata = {
  title: "KarúBox - Plataforma POS",
  description: "KarúBox unifica ventas, caja e inventario en un solo panel multi-tenant.",
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


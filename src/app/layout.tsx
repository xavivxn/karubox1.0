import type { Metadata } from "next";
import "./globals.css";
import { TenantProvider } from "@/contexts/TenantContext";

export const metadata: Metadata = {
  title: "POS Lomitería - Sistema de Punto de Venta",
  description: "Sistema integral de punto de venta para lomitería con gestión de pedidos, cocina y fidelización",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}


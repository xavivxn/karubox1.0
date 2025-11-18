import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}


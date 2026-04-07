"use client";

import Image from "next/image";
import { Instagram, MessageCircle } from "lucide-react";
import { getWhatsAppHref } from "@/lib/whatsapp";

const INSTAGRAM_HREF =
  "https://www.instagram.com/karuboxpy?igsh=emE0eWVmZTB3YXN5&utm_source=qr";

export default function Footer() {
  const waHref = getWhatsAppHref();
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 md:pt-16 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Producto */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg mb-4">
              Producto
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection("features")}
                  className="hover:text-primary transition-colors"
                >
                  Características
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="hover:text-primary transition-colors"
                >
                  Cómo Funciona
                </button>
              </li>
              <li>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Agendar por WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg mb-4">
              Empresa
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Sobre nosotros
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="hover:text-primary transition-colors"
                >
                  Contacto
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Términos de Servicio
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Redes Sociales */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg mb-4">
              Síguenos
            </h3>
            <div className="flex flex-wrap gap-4">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary flex items-center justify-center transition-colors"
                aria-label="WhatsApp +595 982 906021"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href={INSTAGRAM_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary flex items-center justify-center transition-colors"
                aria-label="Instagram KarúBox"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500 leading-relaxed max-w-xs">
              Novedades, tips de operación y mejoras del producto. También
              respondemos consultas por los mismos canales.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="text-center lg:text-left space-y-2">
              <p className="flex flex-wrap justify-center lg:justify-start items-center gap-2 text-sm text-gray-400">
                <span>Desarrollado con</span>
                <span className="text-red-500" aria-hidden>
                  ❤️
                </span>
                <span>en Paraguay</span>
              </p>
              <p className="text-xs text-gray-500 max-w-md mx-auto lg:mx-0">
                Hecho para lomiterías, pizzerías y hamburgueserías que quieren
                pedidos, cocina y caja en un solo lugar.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 lg:items-end text-center lg:text-right lg:max-w-sm lg:pr-14 xl:pr-20">
              <p className="text-gray-400 text-sm order-2 lg:order-1">
                KarúBox by ARDENTIUM Software Technologies® 2025
              </p>
              <div className="order-1 lg:order-2 w-full max-w-xs rounded-xl border border-gray-800 bg-gray-800/35 px-4 py-3 flex items-center gap-3 text-left">
                <Image
                  src="/karubox-logo.png"
                  alt="KarúBox"
                  width={44}
                  height={44}
                  className="rounded-lg shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white font-heading">
                    KarúBox
                  </p>
                  <p className="text-xs text-gray-400 leading-snug">
                    POS en la nube · Cocina en tiempo real · Reportes claros
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


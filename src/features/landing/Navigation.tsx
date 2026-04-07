"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { Loader2, Menu, X } from "lucide-react";
import gsap from "gsap";
import { getWhatsAppHref } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const navCtaClass = cn(
  "bg-primary text-white px-5 py-3 rounded-xl hover:bg-primary-dark transition-all duration-300",
  "font-semibold text-lg xl:text-xl whitespace-nowrap",
  "shadow-[0_4px_18px_rgba(238,95,15,0.35)] hover:shadow-[0_6px_32px_rgba(238,95,15,0.55)] hover:scale-105"
);

const navLoginOutlineClass = cn(
  "inline-flex items-center justify-center bg-transparent border border-primary text-primary",
  "px-5 py-3 rounded-xl font-semibold text-lg whitespace-nowrap",
  "transition-all duration-300",
  "hover:bg-primary/10 hover:shadow-[0_0_0_2px_rgba(238,95,15,0.25)]",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  "dark:focus-visible:ring-offset-gray-900"
);

const LOGIN_HREF = ROUTES.PUBLIC.LOGIN;

export default function Navigation() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginPending, setLoginPending] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (loginPending) {
      e.preventDefault();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    setLoginPending(true);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    router.prefetch(LOGIN_HREF);
  }, [router]);

  /** Si la navegación no termina, volver a habilitar el botón */
  useEffect(() => {
    if (!loginPending) return;
    const t = window.setTimeout(() => setLoginPending(false), 12_000);
    return () => window.clearTimeout(t);
  }, [loginPending]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const el = logoRef.current;
    if (!el) return;
    gsap.to(el, {
      y: -5,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    return () => {
      gsap.killTweensOf(el);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const waHref = getWhatsAppHref();

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl shadow-sm border-b border-gray-200/60 dark:border-gray-700/60"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.25rem] md:min-h-[5.25rem] py-2 md:py-2.5">
          <div className="flex-shrink-0">
            <h1 className="m-0">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 md:gap-3 rounded-xl p-1 -ml-1 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                <div ref={logoRef} className="will-change-transform">
                  <Image
                    src="/karubox-logo.png"
                    alt="KarúBox"
                    width={80}
                    height={80}
                    className="h-14 w-14 md:h-[4.25rem] md:w-[4.25rem] object-contain shrink-0"
                    sizes="(max-width: 768px) 56px, 68px"
                    priority
                  />
                </div>
                <span className="text-2xl md:text-3xl font-heading font-bold text-primary tracking-tight">
                  KarúBox
                </span>
              </button>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Características
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Cómo Funciona
            </button>
            <button
              onClick={() => scrollToSection("requisitos")}
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Requisitos
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Beneficios
            </button>
            <button
              onClick={() => scrollToSection("precio")}
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Precio
            </button>
            <div className="flex items-center gap-4">
              <Link
                href={LOGIN_HREF}
                prefetch
                onClick={handleLoginClick}
                aria-busy={loginPending}
                className={cn(
                  navLoginOutlineClass,
                  "inline-flex min-w-[11.5rem] items-center justify-center gap-2",
                  loginPending && "pointer-events-none opacity-90"
                )}
              >
                {loginPending ? (
                  <>
                    <Loader2
                      className="h-5 w-5 shrink-0 animate-spin"
                      aria-hidden
                    />
                    <span>Cargando…</span>
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className={navCtaClass}
              >
                Agendar Asesoría por WhatsApp
              </a>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary transition-colors py-2"
            >
              Características
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary transition-colors py-2"
            >
              Cómo Funciona
            </button>
            <button
              onClick={() => scrollToSection("requisitos")}
              className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary transition-colors py-2"
            >
              Requisitos
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary transition-colors py-2"
            >
              Beneficios
            </button>
            <button
              onClick={() => scrollToSection("precio")}
              className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary transition-colors py-2"
            >
              Precio
            </button>
            <div className="flex flex-col gap-4 pt-1">
              <Link
                href={LOGIN_HREF}
                prefetch
                onClick={handleLoginClick}
                aria-busy={loginPending}
                className={cn(
                  navLoginOutlineClass,
                  "inline-flex w-full items-center justify-center gap-2 text-xl",
                  loginPending && "pointer-events-none opacity-90"
                )}
              >
                {loginPending ? (
                  <>
                    <Loader2
                      className="h-5 w-5 shrink-0 animate-spin"
                      aria-hidden
                    />
                    <span>Cargando…</span>
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block w-full text-center rounded-xl px-6 py-3 font-semibold text-xl",
                  navCtaClass
                )}
              >
                Agendar Asesoría por WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

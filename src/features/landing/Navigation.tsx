"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { ChevronRight, Loader2, Menu, MessageCircle, X } from "lucide-react";
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

const navMobileWhatsAppClass = cn(
  "inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-xl px-4 py-3.5",
  "font-semibold text-base leading-snug text-center whitespace-normal no-underline",
  "border-2 border-primary/45 bg-primary/8 text-primary hover:bg-primary/12 hover:text-primary-dark",
  "dark:border-primary/50 dark:bg-primary/10",
  "shadow-sm hover:shadow-md",
  "transition-[color,box-shadow,background-color] duration-300",
  "[-webkit-tap-highlight-color:transparent]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
);

export default function Navigation() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigatingLogin, setIsNavigatingLogin] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    router.prefetch(LOGIN_HREF);
  }, [router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

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

  const mobileNavLinks = [
    { id: "features", label: "Características" },
    { id: "how-it-works", label: "Cómo Funciona" },
    { id: "requisitos", label: "Requisitos" },
    { id: "benefits", label: "Beneficios" },
    { id: "precio", label: "Precio" },
  ] as const;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 transition-all duration-300",
        /* Por encima de MobileSticky (96), WhatsAppFloat (100) y ScrollToTop (90) cuando el menú está abierto */
        isMobileMenuOpen ? "z-[110]" : "z-50",
        "max-md:pt-[env(safe-area-inset-top,0px)]",
        isScrolled || isMobileMenuOpen
          ? cn(
              "shadow-sm border-b border-gray-200/60 dark:border-gray-700/60",
              isMobileMenuOpen
                ? "bg-white dark:bg-gray-900"
                : "bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl"
            )
          : "bg-transparent"
      )}
    >
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          tabIndex={-1}
          className="fixed inset-0 z-[40] bg-black/65 backdrop-blur-md md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div className="relative z-[50] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                onClick={() => setIsNavigatingLogin(true)}
                aria-busy={isNavigatingLogin}
                className={cn(
                  navLoginOutlineClass,
                  isNavigatingLogin && "bg-primary text-white border-primary pointer-events-none"
                )}
              >
                {isNavigatingLogin ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </span>
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

          <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href={LOGIN_HREF}
              prefetch
              onClick={() => setIsNavigatingLogin(true)}
              aria-busy={isNavigatingLogin}
              className={cn(
                navLoginOutlineClass,
                "px-3 py-2 min-h-10 text-sm font-semibold rounded-lg sm:px-4 sm:rounded-xl",
                "whitespace-nowrap [-webkit-tap-highlight-color:transparent]",
                isNavigatingLogin &&
                  "bg-primary text-white border-primary pointer-events-none"
              )}
            >
              {isNavigatingLogin ? (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                  Cargando...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </Link>
            <button
              type="button"
              id="mobile-nav-toggle"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "inline-flex items-center justify-center rounded-xl p-2.5 min-h-11 min-w-11",
                "text-gray-800 dark:text-gray-100",
                "border border-gray-200/90 dark:border-gray-600/80",
                "bg-white/70 dark:bg-gray-800/70 shadow-sm",
                "hover:bg-white dark:hover:bg-gray-800 active:scale-[0.98]",
                "transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "dark:focus-visible:ring-offset-gray-900"
              )}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 shrink-0" aria-hidden />
              ) : (
                <Menu className="h-6 w-6 shrink-0" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-heading"
            className="md:hidden pb-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div
              className={cn(
                "overflow-hidden rounded-2xl border shadow-2xl",
                "border-gray-200 bg-white text-gray-900",
                "dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100",
                "shadow-gray-900/15 dark:shadow-black/40"
              )}
            >
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
                <p
                  id="mobile-nav-heading"
                  className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Navegación
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Ir a una sección de la página
                </p>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {mobileNavLinks.map(({ id, label }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3",
                        "min-h-[3.25rem] px-4 py-3 text-left text-base font-medium",
                        "text-gray-900 dark:text-gray-100",
                        "active:bg-gray-100 dark:active:bg-gray-800 hover:text-primary transition-colors"
                      )}
                    >
                      <span>{label}</span>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={navMobileWhatsAppClass}
                >
                  <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
                  <span>Agendar asesoría por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

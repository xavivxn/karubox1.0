"use client";

import { useRef, useLayoutEffect, useEffect, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Play } from "lucide-react";
import { getWhatsAppHref } from "@/lib/whatsapp";
import DemoVideoCard from "./DemoVideoCard";
import HeroTypewriterBanner from "./HeroTypewriterBanner";
import { cn } from "@/lib/utils";

/** Retratos placeholder (Unsplash): perfiles tipo dueños / trabajo en local */
const TRUST_AVATARS = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&h=128&fit=crop&crop=faces&q=80",
] as const;

/** Palabras del H1 con espacio explícito vía gap (evita texto “pegado”). */
const TITLE_PARTS: { text: string; highlight?: boolean }[] = [
  { text: "Gestiona" },
  { text: "tu" },
  { text: "lomitería" },
  { text: "o" },
  { text: "restaurante" },
  { text: "desde" },
  { text: "un" },
  { text: "solo", highlight: true },
  { text: "lugar", highlight: true },
];

/** Mismo stroke que Lucide Play (strokeWidth 2) */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function scrollToDemo() {
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const id = mobile ? "demo-video-mobile" : "demo-video";
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const ctaPrimaryClass = cn(
  "hero-cta group relative w-full sm:w-auto min-h-[3.25rem] bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg sm:text-xl",
  "shadow-[0_10px_40px_-6px_rgba(249,115,22,0.45),0_6px_24px_-4px_rgba(238,95,15,0.35)]",
  "transition-all duration-300",
  "hover:-translate-y-1 hover:shadow-[0_20px_56px_-8px_rgba(249,115,22,0.55),0_12px_36px_-6px_rgba(238,95,15,0.5)]",
  "active:translate-y-0 active:shadow-[0_10px_40px_-6px_rgba(249,115,22,0.45)]",
  "flex items-center justify-center gap-3"
);

const ctaSecondaryClass = cn(
  "hero-cta group w-full sm:w-auto min-h-[3.25rem] border-2 border-primary bg-transparent text-primary px-8 py-4 rounded-xl font-semibold text-lg sm:text-xl",
  "hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300 hover:-translate-y-0.5",
  "flex items-center justify-center gap-2"
);

export default function HeroSection() {
  const wa = getWhatsAppHref();
  const heroRef = useRef<HTMLElement>(null);
  const blobARef = useRef<HTMLDivElement>(null);
  const blobBRef = useRef<HTMLDivElement>(null);
  const blobCRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const playIconRef = useRef<HTMLDivElement>(null);

  const onHeroPointer = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / Math.max(rect.width, 1);
      const ny = (e.clientY - cy) / Math.max(rect.height, 1);
      if (blobARef.current) {
        gsap.to(blobARef.current, {
          x: -nx * 28,
          y: -ny * 22,
          duration: 0.75,
          ease: "power2.out",
        });
      }
      if (blobBRef.current) {
        gsap.to(blobBRef.current, {
          x: nx * 18,
          y: ny * 14,
          duration: 0.85,
          ease: "power2.out",
        });
      }
      if (blobCRef.current) {
        gsap.to(blobCRef.current, {
          x: -nx * 12,
          y: ny * 20,
          duration: 0.7,
          ease: "power2.out",
        });
      }
    },
    []
  );

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const narrow = window.matchMedia("(max-width: 767px)").matches;

    /*
     * En móvil, GSAP + Strict Mode (revert) y blur/opacity dejan a menudo
     * el hero en blanco. El contenido va sin animación de entrada.
     */
    if (reduceMotion || narrow) {
      return;
    }

    let ctx: { revert: () => void } | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const runTimeline = () => {
      if (cancelled) return;
      const root = heroRef.current;
      if (!root) return;

      ctx = gsap.context(() => {
        const words = gsap.utils.toArray<HTMLElement>(".hero-word", root);
        gsap.set(words, { y: 36, opacity: 0, filter: "blur(10px)" });
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.to(words, {
          y: 0,
          opacity: 1,
          filter: "none",
          duration: 0.62,
          stagger: 0.07,
        });
        if (badgeRef.current) {
          tl.from(
            badgeRef.current,
            { scale: 0.92, opacity: 0, duration: 0.45 },
            0
          );
          gsap.to(badgeRef.current, {
            scale: 1.02,
            duration: 1.15,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
        tl.from(".hero-sub", { y: 20, opacity: 0, duration: 0.5 }, "-=0.35");
        // CTAs sin GSAP: el elastic + scale(0) con Strict Mode / revert dejaba los botones invisibles.
        tl.from(
          ".hero-mobile-video",
          { y: 24, opacity: 0, duration: 0.5 },
          "-=0.15"
        );
        tl.from(
          ".hero-micro, .hero-trust",
          { y: 16, opacity: 0, duration: 0.45, stagger: 0.1 },
          "-=0.35"
        );
      }, root);

      const nudgePlay = () => {
        const el = playIconRef.current;
        if (!el) return;
        gsap.timeline().to(el, {
          rotation: -12,
          duration: 0.1,
          yoyo: true,
          repeat: 5,
          ease: "power1.inOut",
        });
      };

      requestAnimationFrame(() => {
        if (cancelled) return;
        nudgePlay();
        intervalId = setInterval(nudgePlay, 5000);
      });
    };

    runTimeline();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      ctx?.revert();
    };
  }, []);

  /* Desktop: si Strict Mode revierte mal la intro, dejar el hero legible. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;

    const root = heroRef.current;
    if (!root) return;

    const restore = () => {
      const selectors =
        ".hero-badge, .hero-word, .hero-sub, .hero-mobile-video, .hero-micro, .hero-trust";
      root.querySelectorAll<HTMLElement>(selectors).forEach((el) => {
        const op = parseFloat(window.getComputedStyle(el).opacity);
        if (op < 0.15) {
          gsap.set(el, { opacity: 1, y: 0, filter: "none" });
        }
      });
    };

    const id = window.setTimeout(restore, 1800);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section
      ref={heroRef}
      onMouseMove={onHeroPointer}
      onPointerMove={onHeroPointer}
      className="relative pt-24 md:pt-32 pb-6 md:pb-8 overflow-hidden bg-gradient-to-br from-primary/10 via-white to-secondary/10 dark:from-primary/5 dark:via-gray-900 dark:to-secondary/5"
    >
      <div
        ref={blobARef}
        className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl will-change-transform"
        aria-hidden
      />
      <div
        ref={blobBRef}
        className="pointer-events-none absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-secondary/20 blur-3xl will-change-transform"
        aria-hidden
      />
      <div
        ref={blobCRef}
        className="pointer-events-none absolute bottom-20 right-1/4 h-56 w-56 rounded-full bg-accent/15 blur-3xl will-change-transform"
        aria-hidden
      />

      <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          <div
            ref={badgeRef}
            className="hero-badge order-1 inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full mb-5 md:mb-6 text-xs sm:text-sm font-medium max-w-[95vw] bg-white/60 dark:bg-gray-900/50 backdrop-blur-md border border-orange-200/50 dark:border-orange-400/25 text-primary dark:text-primary-light shadow-sm"
          >
            <span aria-hidden>🔥</span>
            <span>12 nuevas lomiterías se unieron este mes</span>
          </div>

          <h1 className="order-2 mb-0 w-full max-w-4xl mx-auto text-center tracking-tighter">
            <span className="flex flex-wrap justify-center gap-x-2 gap-y-1 sm:gap-x-2.5 md:gap-x-3 px-1">
              {TITLE_PARTS.map((part, i) => (
                <span
                  key={i}
                  className={cn(
                    "hero-word inline-block font-heading font-extrabold text-gray-900 dark:text-white",
                    "text-2xl sm:text-4xl md:text-5xl lg:text-6xl",
                    part.highlight && "text-primary"
                  )}
                >
                  {part.text}
                </span>
              ))}
            </span>
          </h1>

          <p className="hero-sub order-3 mt-5 md:mt-6 mb-8 md:mb-10 text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-sans leading-[1.7] md:leading-[1.75] max-w-3xl px-2">
            POS, inventario, puntos de fidelidad y reportes en tiempo real.
            Todo lo que necesitas para hacer crecer tu negocio.
          </p>

          <div className="order-4 flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center w-full max-w-2xl mb-8 md:mb-10 px-1">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className={ctaPrimaryClass}
            >
              <WhatsAppIcon className="h-6 w-6 shrink-0 text-white" />
              <span className="text-center leading-snug">
                Agendar Asesoría por WhatsApp
              </span>
            </a>
            <button
              type="button"
              onClick={scrollToDemo}
              className={ctaSecondaryClass}
            >
              <Play
                className="h-6 w-6 shrink-0"
                strokeWidth={2}
                aria-hidden
              />
              Ver demo en video
            </button>
          </div>

          <div
            id="demo-video-mobile"
            className="hero-mobile-video order-5 w-full max-w-lg md:hidden mb-6 scroll-mt-28"
          >
            <DemoVideoCard playIconRef={playIconRef} />
          </div>

          <p className="hero-micro order-6 text-sm md:text-base text-gray-500 dark:text-gray-400 mb-6 md:mb-8 max-w-lg mx-auto px-2">
            Te mostramos cómo ahorrar hasta 4 horas diarias en 10 minutos
          </p>

          <div
            className="hero-trust order-7 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1 cursor-default"
            title="Dueños reales, resultados reales"
          >
            <div className="flex items-center -space-x-3">
              {TRUST_AVATARS.map((src, i) => (
                <div
                  key={src}
                  className="relative z-[1] h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-stone-200 shadow-sm first:z-[4] [&:nth-child(2)]:z-[3] [&:nth-child(3)]:z-[2] dark:border-gray-900"
                >
                  <Image
                    src={src}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    sizes="40px"
                  />
                </div>
              ))}
            </div>
            <span className="pl-3 sm:pl-2 max-w-[14rem] sm:max-w-none text-left sm:text-center">
              Usado por 50+ negocios gastronómicos
            </span>
          </div>
        </div>

        <HeroTypewriterBanner />
      </div>
    </section>
  );
}

"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Play,
  UtensilsCrossed,
  Pizza,
  Coffee,
  ChefHat,
  Sparkles,
  MonitorSmartphone,
  Package,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { getWhatsAppHref } from "@/lib/whatsapp";
import DemoVideoCard from "./DemoVideoCard";
import HeroTypewriterBanner from "./HeroTypewriterBanner";
import { cn } from "@/lib/utils";

const TRUST_AVATARS = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&h=128&fit=crop&crop=faces&q=80",
] as const;

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

const BENEFIT_CARDS: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: MonitorSmartphone,
    title: "POS en cualquier lugar",
    description: "Tablet, PC o móvil. Interfaz clara para turnos rápidos.",
  },
  {
    icon: Package,
    title: "Stock bajo control",
    description: "Inventario y recetas alineados con cada pedido.",
  },
  {
    icon: HeartHandshake,
    title: "Clientes que vuelven",
    description: "Puntos y promos sin fricción para tu equipo.",
  },
];

const FLOAT_DECOR: {
  icon: LucideIcon;
  className: string;
  delay: string;
}[] = [
  {
    icon: UtensilsCrossed,
    className: "top-[14%] left-[4%] hidden md:flex",
    delay: "0s",
  },
  {
    icon: Pizza,
    className: "top-[22%] right-[6%] hidden lg:flex",
    delay: "0.6s",
  },
  {
    icon: Coffee,
    className: "bottom-[38%] left-[8%] hidden md:flex",
    delay: "1.2s",
  },
  {
    icon: ChefHat,
    className: "bottom-[32%] right-[10%] hidden lg:flex",
    delay: "0.3s",
  },
  {
    icon: Sparkles,
    className: "top-[42%] right-[14%] hidden xl:flex",
    delay: "0.9s",
  },
];

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

function GlassBenefitCard({
  icon: Icon,
  title,
  description,
  index,
  reduceMotion,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 22, filter: "blur(10px)" }
      }
      animate={
        reduceMotion
          ? undefined
          : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      transition={{
        duration: 0.55,
        delay: reduceMotion ? 0 : 0.45 + index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative overflow-hidden rounded-2xl"
    >
      <div
        className={cn(
          "relative h-full rounded-2xl border border-white/55 bg-[rgba(255,252,248,0.42)] p-5 text-left shadow-[0_8px_32px_-12px_rgba(255,77,0,0.15)] backdrop-blur-xl",
          "dark:border-orange-400/20 dark:bg-gray-950/45 dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)]"
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
          style={{
            background:
              "linear-gradient(125deg, transparent 0%, rgba(255,77,0,0.12) 35%, rgba(255,248,235,0.55) 50%, rgba(255,77,0,0.1) 65%, transparent 100%)",
            backgroundSize: "200% 200%",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-0 transition-transform duration-0 group-hover:translate-x-full group-hover:opacity-100 group-hover:duration-700 group-hover:ease-out dark:via-orange-200/25"
          aria-hidden
        />
        <div className="relative flex flex-col gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4d00]/15 to-orange-100/80 text-[#ea580c] shadow-inner dark:from-orange-500/25 dark:to-orange-900/40 dark:text-orange-300">
            <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <h3 className="font-heading text-base font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export default function HeroSection() {
  const wa = getWhatsAppHref();
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [glowPct, setGlowPct] = useState({ x: 50, y: 42 });

  const onHeroPointer = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      if (reduceMotion) return;
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const y = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      setGlowPct({ x, y });
    },
    [reduceMotion]
  );

  const titleContainer: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.065,
        delayChildren: reduceMotion ? 0 : 0.08,
      },
    },
  };

  const titleWord: Variants = {
    hidden: reduceMotion
      ? { opacity: 1, y: 0, filter: "none" }
      : { opacity: 0, y: 32, filter: "blur(12px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "none",
      transition: reduceMotion
        ? { duration: 0 }
        : { duration: 0.58, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={onHeroPointer}
      onPointerMove={onHeroPointer}
      className="relative overflow-hidden bg-gradient-to-br from-[#fff8f0] via-white to-[#fff5eb] pb-6 pt-24 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 md:pb-8 md:pt-32"
    >
      {/* Animated mesh (naranja + crema) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="animate-hero-mesh-a absolute -left-[20%] top-[-15%] h-[min(90vw,520px)] w-[min(90vw,520px)] rounded-full bg-gradient-to-br from-[#ff4d00]/18 via-orange-300/25 to-transparent blur-3xl dark:from-[#ff4d00]/12 dark:via-orange-600/20"
        />
        <div
          className="animate-hero-mesh-b absolute -right-[15%] top-[25%] h-[min(85vw,480px)] w-[min(85vw,480px)] rounded-full bg-gradient-to-bl from-amber-100/90 via-[#ffe8d4]/80 to-orange-200/40 blur-3xl dark:from-orange-900/30 dark:via-orange-950/40 dark:to-transparent"
        />
        <div
          className="animate-hero-mesh-c absolute bottom-[-10%] left-[20%] h-[min(70vw,420px)] w-[min(70vw,420px)] rounded-full bg-gradient-to-tr from-[#ff4d00]/12 via-[#fff4e6]/90 to-amber-50/70 blur-3xl dark:from-orange-600/15 dark:via-orange-950/35 dark:to-transparent"
        />
      </div>

      {/* Interactive glow follower (#ff4d00 → transparent, blur 120px) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute h-[min(120vw,900px)] w-[min(120vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.55] dark:opacity-[0.35]"
          style={{
            left: `${glowPct.x}%`,
            top: `${glowPct.y}%`,
            background:
              "radial-gradient(circle closest-side, rgba(255, 77, 0, 0.26) 0%, rgba(255, 77, 0, 0.08) 35%, transparent 70%)",
            filter: "blur(120px)",
          }}
        />
      </div>

      {/* Floating decor (Lucide) */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        {FLOAT_DECOR.map(({ icon: Icon, className, delay }, i) => (
          <div
            key={`float-${i}`}
            className={cn(
              "animate-hero-float-decor absolute text-[#ff4d00]/35 dark:text-orange-400/30",
              className
            )}
            style={{ animationDelay: delay }}
          >
            <Icon className="h-7 w-7 md:h-8 md:w-8" strokeWidth={1.25} />
          </div>
        ))}
      </div>

      <div className="relative z-[2] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={reduceMotion ? false : { scale: 0.94, opacity: 0 }}
            animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 mb-5 inline-flex max-w-[95vw] items-center gap-2 rounded-full border border-orange-200/60 bg-white/55 px-3 py-2 text-xs font-medium text-primary shadow-sm backdrop-blur-md dark:border-orange-400/25 dark:bg-gray-900/50 dark:text-primary-light md:mb-6 md:px-4 md:py-2.5 md:text-sm"
          >
            <span aria-hidden>🔥</span>
            <span>12 nuevas lomiterías se unieron este mes</span>
          </motion.div>

          <motion.h1
            variants={titleContainer}
            initial="hidden"
            animate="visible"
            className="order-2 mb-0 w-full max-w-4xl px-1 text-center tracking-tighter"
          >
            <span className="flex flex-wrap justify-center gap-x-2 gap-y-1 sm:gap-x-2.5 md:gap-x-3">
              {TITLE_PARTS.map((part, i) => (
                <motion.span
                  key={i}
                  variants={titleWord}
                  className={cn(
                    "inline-block font-heading text-2xl font-extrabold text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl",
                    part.highlight && "text-primary"
                  )}
                >
                  {part.text}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="hero-sub order-3 mx-auto mb-8 mt-5 max-w-3xl px-2 font-sans text-lg leading-[1.7] text-slate-600 dark:text-slate-400 sm:text-xl md:mb-10 md:mt-6 md:text-2xl md:leading-[1.75]"
          >
            POS, inventario, puntos de fidelidad y reportes en tiempo real.
            Todo lo que necesitas para hacer crecer tu negocio.
          </motion.p>

          {/* Glassmorphism benefit cards */}
          <div className="order-4 mb-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3 md:mb-10">
            {BENEFIT_CARDS.map((card, i) => (
              <GlassBenefitCard
                key={card.title}
                {...card}
                index={i}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.75 }}
            className="order-5 mb-8 flex w-full max-w-2xl flex-col items-stretch justify-center gap-4 px-1 sm:flex-row sm:items-center md:mb-10"
          >
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
              <Play className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden />
              Ver demo en video
            </button>
          </motion.div>

          <div
            id="demo-video-mobile"
            className="hero-mobile-video order-6 mb-6 w-full max-w-lg scroll-mt-28 md:hidden"
          >
            <DemoVideoCard />
          </div>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.85 }}
            className="hero-micro order-7 mx-auto mb-6 max-w-lg px-2 text-sm text-gray-500 dark:text-gray-400 md:mb-8 md:text-base"
          >
            Te mostramos cómo ahorrar hasta 4 horas diarias en 10 minutos
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.92 }}
            className="hero-trust order-8 mb-1 flex cursor-default flex-wrap items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400"
            title="Dueños reales, resultados reales"
          >
            <div className="-space-x-3 flex items-center">
              {TRUST_AVATARS.map((src) => (
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
            <span className="max-w-[14rem] pl-3 text-left sm:max-w-none sm:pl-2 sm:text-center">
              Usado por 50+ negocios gastronómicos
            </span>
          </motion.div>
        </div>

        <HeroTypewriterBanner />
      </div>
    </section>
  );
}

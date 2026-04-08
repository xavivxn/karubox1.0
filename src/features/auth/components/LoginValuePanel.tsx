"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginHeader } from "./LoginHeader";

const ACCESS_HIGHLIGHTS = [
  {
    icon: "⚡",
    text: "Rápido y Eficiente — Tomá pedidos en segundos.",
  },
  {
    icon: "⭐",
    text: "Puntos de Fidelidad — Premiá a tus clientes frecuentes.",
  },
  {
    icon: "📊",
    text: "Reportes Detallados — Analizá ventas en tiempo real.",
  },
] as const;

export function LoginValuePanel() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col justify-center p-0 lg:min-h-0">
      {reduceMotion ? (
        <div
          className="pointer-events-none absolute -inset-2.5 z-0 rounded-2xl bg-gradient-to-r from-orange-500/16 via-amber-500/10 to-orange-500/16 opacity-80 blur-xl sm:rounded-3xl"
          aria-hidden
        />
      ) : (
        <motion.div
          className="pointer-events-none absolute -inset-2.5 z-0 rounded-2xl bg-gradient-to-r from-orange-500/18 via-amber-500/11 to-orange-500/18 blur-xl sm:rounded-3xl"
          animate={{ opacity: [0.45, 0.72, 0.45] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "relative z-10 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-orange-400/18 sm:rounded-3xl",
          "shadow-[0_0_0_1px_hsl(var(--primary)_/_0.09),0_20px_60px_-16px_rgba(0,0,0,0.45),0_0_48px_-12px_hsl(var(--primary)_/_0.14)]"
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-slate-900/70 via-slate-950/95 to-slate-950"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-orange-300/45 to-transparent shadow-[0_0_12px_hsl(var(--primary-light)_/_0.35)]" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center gap-4 px-5 py-6 sm:gap-5 sm:px-6 sm:py-7 md:px-8">
          <LoginHeader comfortable />

          <div className="border-t border-orange-500/14 pt-4 sm:pt-5">
            <div className="mb-2 flex items-center gap-2 text-slate-300">
              <Sparkles className="h-4 w-4 shrink-0 text-orange-300 sm:h-5 sm:w-5 drop-shadow-[0_0_8px_hsl(var(--primary)_/_0.45)]" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest sm:text-sm">
                Tu panel de trabajo
              </span>
            </div>

            <p className="font-heading text-lg font-bold leading-snug tracking-tight text-slate-50 sm:text-xl">
              Todo tu local,{" "}
              <span className="bg-gradient-to-r from-amber-100 via-orange-200 to-amber-50 bg-clip-text text-transparent drop-shadow-[0_0_20px_hsl(var(--primary)_/_0.2)]">
                en una sola pantalla
              </span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
              Iniciá sesión para gestionar pedidos, cocina y caja en tiempo real.
            </p>
          </div>

          <ul className="space-y-2.5 text-left sm:space-y-3">
            {ACCESS_HIGHLIGHTS.map(({ icon, text }, i) => (
              <motion.li
                key={text}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.08 + i * 0.06,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-start gap-3 text-sm text-slate-200 sm:text-[0.9375rem]"
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-base shadow-[0_0_16px_hsl(var(--primary)_/_0.32),0_4px_12px_rgba(124,45,18,0.28)] sm:h-9 sm:w-9 sm:text-lg"
                  aria-hidden
                >
                  {icon}
                </span>
                <span className="leading-snug">{text}</span>
              </motion.li>
            ))}
          </ul>

          <Link
            href="/"
            className="group inline-flex items-center gap-2 self-start rounded-xl border border-orange-500/24 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-orange-400/38 hover:bg-orange-500/10 hover:shadow-[0_0_20px_-4px_hsl(var(--primary)_/_0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}

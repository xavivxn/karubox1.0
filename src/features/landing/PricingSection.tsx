"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock,
  MessageCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { getWhatsAppHref } from "@/lib/whatsapp";
import {
  LANDING_MONTHLY_PRICE_GS,
  LANDING_PRICING_INCLUDES,
} from "@/config/landingPricing";
import { cn } from "@/lib/utils";
import { PricingFireworks } from "./PricingFireworks";

export { LANDING_MONTHLY_PRICE_GS } from "@/config/landingPricing";

export default function PricingSection() {
  const reduceMotion = useReducedMotion();
  const wa = getWhatsAppHref();
  const priceFormatted = LANDING_MONTHLY_PRICE_GS.toLocaleString("es-PY");

  return (
    <section
      id="precio"
      className="relative isolate overflow-hidden py-24 md:py-32"
    >
      {/* Fondo atmosférico */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gray-950 via-[#1a0a02] to-gray-950"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.25),transparent)]"
        aria-hidden
      />

      {!reduceMotion && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.32, 0.5, 0.32],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-orange-500/25 blur-[100px]"
            aria-hidden
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.28, 0.48, 0.28],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="pointer-events-none absolute -right-24 bottom-1/4 h-[24rem] w-[24rem] rounded-full bg-amber-400/20 blur-[90px]"
            aria-hidden
          />
          <motion.div
            animate={{
              scale: [1, 1.06, 1],
              opacity: [0.2, 0.35, 0.2],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[20rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/10 blur-[80px]"
            aria-hidden
          />
        </>
      )}

      {/* Grilla sutil */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Todo KarúBox,{" "}
            <span className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-100 bg-clip-text text-transparent">
              un solo plan
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Sin letras chicas en el número: sabés cuánto invertís por mes para
            llevar tu operación al día.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-14"
        >
          {/* Brillo suave detrás de la tarjeta */}
          {!reduceMotion && (
            <motion.div
              className="absolute -inset-px z-0 rounded-[2rem] bg-gradient-to-r from-orange-500/35 via-amber-400/25 to-orange-500/35 blur-xl"
              animate={{ opacity: [0.65, 0.95, 0.65] }}
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
              "relative z-10 overflow-hidden rounded-3xl border border-white/10",
              "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_25px_80px_-12px_rgba(0,0,0,0.65),0_0_60px_-15px_rgba(249,115,22,0.35)]"
            )}
          >
            {/* Fuegos artificiales DENTRO de la tarjeta (antes tapaba el fondo opaco) */}
            <PricingFireworks disabled={!!reduceMotion} />
            {/* Velo legible: deja ver chispas sin perder contraste del texto */}
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-gray-950/82 to-gray-950/92"
              aria-hidden
            />

            {/* Reflejo superior */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <div className="relative z-10 px-6 py-10 md:px-12 md:py-14">
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 flex items-center gap-2 text-amber-200/90">
                  <Zap className="h-5 w-5" aria-hidden />
                  <span className="text-sm font-semibold uppercase tracking-widest">
                    KarúBox Full
                  </span>
                </div>

                <div className="relative">
                  <p
                    className={cn(
                      "font-heading text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl",
                      "bg-gradient-to-b from-white via-orange-50 to-orange-200/90 bg-clip-text text-transparent",
                      "drop-shadow-[0_4px_24px_rgba(249,115,22,0.35)]"
                    )}
                  >
                    Gs. {priceFormatted}
                  </p>
                  <span className="mt-2 block text-lg font-medium text-gray-400 md:text-xl">
                    al mes
                  </span>
                </div>

                <p className="mt-6 max-w-md text-sm text-gray-500">
                  Montos referenciales en guaraníes. Condiciones comerciales y
                  alcance se confirman en la asesoría.
                </p>

                <p className="mt-4 text-sm font-medium text-amber-200/90">
                  Pensado para locales gastronómicos en Paraguay — un equipo que
                  entiende pedidos, cocina y salón.
                </p>
              </div>

              <ul className="mx-auto mt-10 max-w-md space-y-3 text-left">
                {LANDING_PRICING_INCLUDES.map((line, i) => (
                  <motion.li
                    key={line}
                    initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                    className="flex items-start gap-3 text-gray-200"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-[0_4px_12px_rgba(249,115,22,0.4)]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-base leading-snug">{line}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col items-center gap-4">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-8 py-4 text-lg font-semibold text-white shadow-[0_12px_40px_rgba(238,95,15,0.45)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_16px_48px_rgba(238,95,15,0.55)] sm:w-auto"
                >
                  Consultar por WhatsApp
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
                <p className="max-w-md text-center text-sm text-gray-400">
                  Asesoría para ver si KarúBox encaja en tu operación —{" "}
                  <span className="text-gray-300">
                    sin compromiso al chatear
                  </span>
                  . Coordinamos demo cuando quieras.
                </p>
              </div>

              <div className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/10 pt-8 text-xs text-gray-400 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle
                    className="h-4 w-4 shrink-0 text-orange-400"
                    aria-hidden
                  />
                  Respuesta en horario laboral
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck
                    className="h-4 w-4 shrink-0 text-orange-400"
                    aria-hidden
                  />
                  Precio claro, sin letra chica
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock
                    className="h-4 w-4 shrink-0 text-orange-400"
                    aria-hidden
                  />
                  Implementación acompañada
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

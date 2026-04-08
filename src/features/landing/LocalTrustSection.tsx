"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  LANDING_TRUST_CATEGORY_LABEL as categoryLabel,
  LANDING_TRUST_TESTIMONIALS as testimonials,
  type LandingTrustTestimonial as Testimonial,
} from "@/config/landingTrustTestimonials";
import { cn } from "@/lib/utils";

function OperationSticker({ t }: { t: Testimonial }) {
  if (!t.operationImageSrc) return null;
  const alt =
    t.operationImageAlt ??
    `${t.name} operando con KarúBox en ${t.business}`;

  return (
    <div className="mt-5 flex w-full justify-center px-1">
      <div
        className={cn(
          "relative w-full max-w-[min(100%,17.5rem)] sm:max-w-[19rem]",
          "rounded-sm bg-white p-2 pb-7 shadow-[0_14px_32px_-10px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.08]",
          "-rotate-[2.5deg] transition-[transform,box-shadow] duration-300 ease-out",
          "hover:rotate-0 hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]",
          "dark:bg-gray-100 dark:ring-white/15",
        )}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] bg-gray-200 dark:bg-gray-300">
          <Image
            src={t.operationImageSrc}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 80vw, 304px"
          />
        </div>
        <p className="mt-2 text-center text-[11px] font-medium italic leading-tight text-gray-500 dark:text-gray-600 sm:text-xs">
          En acción con KarúBox
        </p>
      </div>
    </div>
  );
}

function Avatar({ t }: { t: Testimonial }) {
  if (t.imageSrc) {
    return (
      <div className="relative mb-4 h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md ring-2 ring-primary/20 dark:border-gray-700">
        <Image
          src={t.imageSrc}
          alt={`${t.name} — ${t.business}`}
          width={192}
          height={192}
          className="h-full w-full object-cover"
          sizes="96px"
          priority
        />
      </div>
    );
  }
  return (
    <div
      className="mb-4 h-24 w-24 shrink-0 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 dark:from-primary/40 dark:to-secondary/40 border-2 border-white shadow-md ring-2 ring-primary/20 dark:border-gray-700"
      aria-hidden
    />
  );
}

export default function LocalTrustSection() {
  const hasMany = testimonials.length > 1;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollTo = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement | undefined;
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  const step = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(testimonials.length - 1, index + delta));
      setIndex(next);
      scrollTo(next);
    },
    [index, scrollTo]
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const updateIndex = () => {
      if (el.children.length === 0) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < el.children.length; i++) {
        const c = el.children[i] as HTMLElement;
        const mid = c.offsetLeft + c.offsetWidth / 2;
        const d = Math.abs(center - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      setIndex(best);
    };

    el.addEventListener("scroll", updateIndex, { passive: true });
    const ro = new ResizeObserver(updateIndex);
    ro.observe(el);
    updateIndex();
    return () => {
      el.removeEventListener("scroll", updateIndex);
      ro.disconnect();
    };
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section
      id="trust"
      className="py-16 md:py-20 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4"
        >
          {hasMany ? "Ya confían en KarúBox" : "Historias con KarúBox"}
        </motion.h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          {hasMany
            ? "Lomiterías, pizzerías y hamburgueserías que ya digitalizaron pedidos, cocina y caja."
            : "Cada local cuenta cómo ordena pedidos, cocina y caja."}
        </p>

        <div className="relative">
          {hasMany ? (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={index === 0}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-1 sm:translate-x-0 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-md transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={index === testimonials.length - 1}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1 sm:translate-x-0 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-md transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <div
            ref={scrollerRef}
            className={cn(
              "flex gap-6 pb-4 pt-1 -mx-4 px-4 sm:mx-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
              hasMany
                ? "overflow-x-auto scroll-smooth snap-x snap-mandatory sm:px-10"
                : "justify-center overflow-x-hidden sm:px-0",
            )}
            style={hasMany ? { scrollbarGutter: "stable" } : undefined}
            tabIndex={hasMany ? 0 : undefined}
            role="region"
            aria-roledescription={hasMany ? "carrusel" : undefined}
            aria-label={
              hasMany ? "Testimonios de clientes" : "Historia destacada de un cliente"
            }
          >
            {testimonials.map((t, i) => (
              <motion.figure
                key={`${t.name}-${t.business}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
                className={cn(
                  "flex flex-col items-center text-center rounded-2xl bg-white/80 dark:bg-gray-900/60 px-5 py-6 border border-gray-100 dark:border-gray-700 shadow-sm",
                  hasMany
                    ? "snap-center shrink-0 w-[min(100%,280px)] sm:w-[300px]"
                    : "w-full max-w-md sm:max-w-lg shrink-0",
                )}
              >
                {!hasMany ? (
                  <span className="mb-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary dark:border-primary/30 dark:bg-primary/15">
                    Historia destacada
                  </span>
                ) : null}
                <Avatar t={t} />
                <figcaption className="space-y-2 w-full">
                  <p className="font-heading font-bold text-gray-900 dark:text-white">
                    {t.name}
                  </p>
                  {t.role ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.role}
                    </p>
                  ) : null}
                  <p className="text-sm text-primary font-medium">
                    <span>{t.business}</span>
                    {t.businessHandle ? (
                      <>
                        <span
                          className="text-gray-400 dark:text-gray-500 font-normal"
                          aria-hidden
                        >
                          {" "}
                          ·{" "}
                        </span>
                        <span className="font-normal">
                          @{t.businessHandle.replace(/^@/, "")}
                        </span>
                      </>
                    ) : null}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary/90">
                    {categoryLabel[t.category]}
                  </p>
                  <blockquote className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <OperationSticker t={t} />
                </figcaption>
              </motion.figure>
            ))}
          </div>

          {hasMany ? (
            <div
              className="flex justify-center gap-2 mt-2"
              role="tablist"
              aria-label="Ir a testimonio"
            >
              {testimonials.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`${t.name}, testimonio ${i + 1} de ${testimonials.length}`}
                  onClick={() => {
                    setIndex(i);
                    scrollTo(i);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    i === index
                      ? "w-6 bg-primary"
                      : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

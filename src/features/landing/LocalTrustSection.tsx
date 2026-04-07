"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Category = "lomitería" | "pizzería" | "hamburguesería";

type Testimonial = {
  name: string;
  business: string;
  category: Category;
  quote: string;
  /** Ruta en /public; si falta, se muestra avatar degradado */
  imageSrc?: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Atlas Burguer",
    business: "Lo bueno es distinto.",
    category: "hamburguesería",
    quote:
      "Con KarúBox la caja y los pedidos de delivery van ordenados; menos errores en hora pico y más tiempo para lo que importa: la burger.",
    imageSrc: "/landing/atlas-burguer.png",
  },
  {
    name: "Don Julio",
    business: "Lomitería El Bunker",
    category: "lomitería",
    quote:
      "Desde que uso KarúBox, ya no me faltan ingredientes al final del día.",
  },
  {
    name: "Laura Giménez",
    business: "Lomitería San Roque",
    category: "lomitería",
    quote:
      "Los combos y extras se cargan solos en el ticket; en cocina sabemos exactamente qué armar.",
  },
  {
    name: "Miguel Ángel Ferreira",
    business: "Lomitería 8 de Diciembre",
    category: "lomitería",
    quote:
      "El stock por turno me salvó: veo qué se vendió y qué hay que pedir al proveedor.",
  },
  {
    name: "Rosi Benítez",
    business: "Lomitería La Esquina",
    category: "lomitería",
    quote:
      "Desde el celular veo las ventas del día. Para alguien que no es de tecnología, es re fácil.",
  },
  {
    name: "Valentina Ríos",
    business: "Pizzería Donatello",
    category: "pizzería",
    quote:
      "Las mesas y para llevar en un solo lugar: menos confusiones entre horno y mostrador.",
  },
  {
    name: "Andrés Caballero",
    business: "Pizzería Napoli Express",
    category: "pizzería",
    quote:
      "Los tiempos de preparación los llevamos mejor; el cliente sabe cuándo sale su pizza.",
  },
  {
    name: "Nico Duarte",
    business: "Smash House",
    category: "hamburguesería",
    quote:
      "Los puntos de fidelidad los lleva el sistema; mis clientes vuelven más seguido.",
  },
  {
    name: "María Elena Villalba",
    business: "Burger Central",
    category: "hamburguesería",
    quote:
      "En la barra no perdemos tiempo con papeles: el ticket sale solo y la cocina ya sabe qué preparar.",
  },
];

const categoryLabel: Record<Category, string> = {
  lomitería: "Lomitería",
  pizzería: "Pizzería",
  hamburguesería: "Hamburguesería",
};

function Avatar({ t }: { t: Testimonial }) {
  if (t.imageSrc) {
    return (
      <div className="relative mb-4 h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md ring-2 ring-primary/20 dark:border-gray-700">
        <Image
          src={t.imageSrc}
          alt={`Logo de ${t.name}`}
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
          Ya confían en KarúBox
        </motion.h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Lomiterías, pizzerías y hamburgueserías que ya digitalizaron pedidos, cocina y caja.
        </p>

        <div className="relative">
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

          <div
            ref={scrollerRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-10 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            style={{ scrollbarGutter: "stable" }}
            tabIndex={0}
            role="region"
            aria-roledescription="carrusel"
            aria-label="Testimonios de clientes"
          >
            {testimonials.map((t, i) => (
              <motion.figure
                key={`${t.name}-${t.business}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
                className="snap-center shrink-0 w-[min(100%,280px)] sm:w-[300px] flex flex-col items-center text-center rounded-2xl bg-white/80 dark:bg-gray-900/60 px-5 py-6 border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <Avatar t={t} />
                <figcaption className="space-y-2 w-full">
                  <p className="font-heading font-bold text-gray-900 dark:text-white">
                    {t.name}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary/90">
                    {categoryLabel[t.category]}
                  </p>
                  <p className="text-sm text-primary font-medium">{t.business}</p>
                  <blockquote className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </figcaption>
              </motion.figure>
            ))}
          </div>

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
        </div>
      </div>
    </section>
  );
}

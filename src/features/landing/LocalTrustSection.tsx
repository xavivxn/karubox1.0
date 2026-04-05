"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Don Julio",
    place: "Lomitería El Bunker",
    quote:
      "Desde que uso KarúBox, ya no me faltan ingredientes al final del día",
  },
  {
    name: "María Elena Villalba",
    place: "Cafetería Central",
    quote:
      "En la barra no perdemos tiempo con papeles: el ticket sale solo y la cocina ya sabe qué preparar",
  },
  {
    name: "Carlos Acosta",
    place: "Parrilla San Roque",
    quote:
      "Los puntos de fidelidad los lleva el sistema; mis clientes vuelven más seguido",
  },
  {
    name: "Rosi Benítez",
    place: "Comedor La Esquina",
    quote:
      "Desde el celular veo las ventas del día. Para alguien que no es de tecnología, es re fácil",
  },
];

export default function LocalTrustSection() {
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
          className="text-2xl md:text-3xl font-heading font-bold text-center text-gray-900 dark:text-white mb-12"
        >
          Ya confían en KarúBox
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {testimonials.map((t, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 dark:from-primary/40 dark:to-secondary/40 border-2 border-white dark:border-gray-700 shadow-md mb-4 ring-2 ring-primary/20"
                aria-hidden
              />
              <figcaption className="space-y-2">
                <p className="font-heading font-bold text-gray-900 dark:text-white">
                  {t.name}
                </p>
                <p className="text-sm text-primary font-medium">{t.place}</p>
                <blockquote className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

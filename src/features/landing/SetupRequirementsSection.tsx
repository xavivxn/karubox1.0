"use client";

import { Laptop, Printer, Wifi, Clock } from "lucide-react";
import { motion } from "framer-motion";

const requirements = [
  {
    icon: Laptop,
    title: "Notebook o PC",
    description:
      "Una computadora en el mostrador o caja para operar el POS y administrar tu negocio con comodidad.",
  },
  {
    icon: Printer,
    title: "Impresora térmica Epson",
    description:
      "Conectada por USB o red a tu PC o laptop central en el local. Tomás el pedido desde donde quieras; el agente imprime en esa impresora. Otros modelos térmicos: consultanos.",
  },
  {
    icon: Wifi,
    title: "WiFi estable",
    description:
      "Red en el local para sincronizar pedidos con la PC central y que la impresión remota llegue a la impresora conectada ahí.",
  },
];

export default function SetupRequirementsSection() {
  return (
    <section
      id="requisitos"
      className="scroll-mt-24 py-16 md:py-24 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200/80 dark:border-gray-700/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-14"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            Qué necesitás para instalar KarúBox
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tres cosas concretas en tu local. Sin sorpresas antes de arrancar.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-12">
          {requirements.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-700 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mb-5 shadow-md">
                <item.icon className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="max-w-3xl mx-auto rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 dark:from-primary/20 dark:via-secondary/15 dark:to-accent/15 border border-primary/20 dark:border-primary/30 px-5 py-5 md:px-8 md:py-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md mx-auto sm:mx-0">
              <Clock className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-heading font-bold text-lg md:text-xl text-gray-900 dark:text-white mb-1">
                Implementación en 24 horas
              </p>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Plazo típico una vez confirmados tu equipo, la impresora térmica
                Epson (o compatible acordada) y una conexión WiFi estable en el
                local. Te acompañamos en la puesta en marcha.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

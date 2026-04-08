"use client";

import { X, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function ProblemSolutionSection() {
  const problems = [
    "Control de inventario manual y propenso a errores",
    "Sistema de puntos de fidelidad complicado",
    "Reportes dispersos en diferentes lugares",
    "Tiempo perdido en tareas administrativas",
  ];

  const solutions = [
    "Todo centralizado en una plataforma",
    "Automatización inteligente",
    "Reportes en tiempo real",
    "Más tiempo para lo que importa: tus clientes",
  ];

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            ¿Cansado de gestionar tu negocio gastronómico con múltiples
            herramientas?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Problems */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-8 border border-red-100 dark:border-red-900/20"
          >
            <h3 className="text-2xl font-heading font-bold text-red-600 dark:text-red-400 mb-6">
              Problemas Comunes
            </h3>
            <ul className="space-y-4">
              {problems.map((problem, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <X className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-lg">
                    {problem}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-8 border border-green-100 dark:border-green-900/20"
          >
            <h3 className="text-2xl font-heading font-bold text-green-600 dark:text-green-400 mb-6">
              Nuestra Solución
            </h3>
            <ul className="space-y-4">
              {solutions.map((solution, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <Check className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-lg">
                    {solution}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


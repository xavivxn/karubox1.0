"use client";

import { Clock, TrendingUp, Heart } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  {
    icon: Clock,
    title: "Ahorra Tiempo",
    description:
      "Automatiza tareas repetitivas y enfócate en lo importante",
    stat:
      "Recupera 4 horas de tu día para estar con tu familia o hacer crecer tu local",
    color: "from-primary to-primary-light",
  },
  {
    icon: TrendingUp,
    title: "Toma Mejores Decisiones",
    description:
      "Reportes en tiempo real te ayudan a entender tu negocio",
    stat: "Acceso instantáneo a todas tus métricas",
    color: "from-secondary to-secondary-light",
  },
  {
    icon: Heart,
    title: "Mejora la Experiencia del Cliente",
    description:
      "Sistema de puntos de fidelidad que funciona automáticamente",
    stat: "Clientes más felices, más ventas",
    color: "from-accent to-accent-light",
  },
];

export default function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="py-20 md:py-32 bg-gradient-to-br from-primary/5 via-white to-secondary/5 dark:from-primary/10 dark:via-gray-900 dark:to-secondary/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            ¿Por qué elegir KarúBox?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group"
            >
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <benefit.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                {benefit.description}
              </p>
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-primary dark:text-primary-light font-semibold text-base md:text-lg leading-snug">
                  {benefit.stat}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


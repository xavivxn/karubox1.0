"use client";

import {
  Tablet,
  Package,
  Star,
  BarChart3,
  Printer,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Tablet,
    title: "Punto de Venta (POS) Intuitivo",
    description:
      "Toma pedidos rápidamente, personaliza cada orden y gestiona clientes desde cualquier dispositivo.",
    benefit: "Aumenta la velocidad de servicio",
    color: "from-primary to-primary-light",
  },
  {
    icon: Package,
    title: "Inventario Automático",
    description:
      "Controla ingredientes y productos. Se descuenta automáticamente con cada pedido confirmado.",
    benefit: "Nunca te quedes sin stock",
    color: "from-secondary to-secondary-light",
  },
  {
    icon: Star,
    title: "Puntos de Fidelidad",
    description:
      "Sistema automático de puntos: 1 punto = 1 Guaraní. Los clientes pueden canjear puntos por productos.",
    benefit: "Fideliza a tus clientes automáticamente",
    color: "from-accent to-accent-light",
  },
  {
    icon: BarChart3,
    title: "Dashboard en Tiempo Real",
    description:
      "Ventas del día, productos más vendidos, clientes frecuentes y alertas de inventario. Todo en un solo lugar.",
    benefit: "Toma decisiones informadas",
    color: "from-primary to-secondary",
  },
  {
    icon: Printer,
    title: "Impresión remota automática",
    description:
      "La impresora térmica va conectada a una PC o laptop central en el local. Podés tomar el pedido en el celular en la calle o con el cliente en el auto; al confirmar, ticket de cocina, comanda y factura salen por esa impresora, sin que tengas que volver al mostrador.",
    benefit: "Un solo flujo, sin ir y venir con papeles",
    color: "from-secondary to-accent",
  },
  {
    icon: Building2,
    title: "Multi-Sucursal",
    description:
      "Cada sucursal tiene su espacio independiente. Perfecto para cadenas o franquicias.",
    benefit: "Escalable para cualquier tamaño",
    color: "from-primary to-accent",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 md:py-32 bg-gray-50 dark:bg-gray-800"
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
            Todo lo que necesitas para gestionar tu negocio gastronómico
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Una plataforma completa que integra todas las herramientas
            necesarias para hacer crecer tu negocio
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group"
            >
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {feature.description}
              </p>
              <p className="text-sm font-semibold text-primary dark:text-primary-light">
                {feature.benefit}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


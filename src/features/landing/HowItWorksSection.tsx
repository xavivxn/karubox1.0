"use client";

import {
  Car,
  Printer,
  ChefHat,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Car,
    title: "Pedido en el auto o en la vereda",
    description:
      "Tu equipo carga el pedido en KarúBox desde el celular o cualquier dispositivo. El cliente puede esperar en el vehículo frente al local.",
    color: "from-primary to-primary-light",
  },
  {
    icon: Printer,
    title: "Impresión remota al instante",
    description:
      "Ticket, comanda y factura salen por la impresora térmica conectada a la PC o laptop central. No hace falta estar al lado de esa máquina para tomar el pedido.",
    color: "from-secondary to-secondary-light",
  },
  {
    icon: ChefHat,
    title: "Cocina prepara con el ticket",
    description:
      "El ticket ya salió en la impresora de la PC central; cocina prepara y caja cobra con la misma información.",
    color: "from-accent to-accent-light",
  },
  {
    icon: Users,
    title: "Cliente recibe y gana puntos",
    description: "El cliente recibe su pedido y acumula puntos automáticamente",
    color: "from-primary to-secondary",
  },
  {
    icon: BarChart3,
    title: "Inventario se actualiza solo",
    description: "El sistema actualiza el inventario y genera reportes en tiempo real",
    color: "from-secondary to-accent",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 md:py-32 bg-white dark:bg-gray-900"
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
            Flujo de trabajo centralizado y eficiente
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Pedidos desde cualquier dispositivo; impresión en la PC o laptop
            central donde está conectada la impresora térmica.
          </p>
        </motion.div>

        {/* Desktop: Horizontal Flow */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between relative">
            {/* Connection Line */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-20 -z-10"></div>

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-1 flex flex-col items-center relative"
              >
                <div
                  className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg hover:scale-110 transition-transform duration-300`}
                >
                  <step.icon className="w-12 h-12 text-white" />
                </div>
                <div className="text-center max-w-[200px]">
                  <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="absolute top-12 right-[-50%] w-8 h-8 text-primary opacity-50" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet: Vertical Flow */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start gap-6"
            >
              <div
                className={`w-20 h-20 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
              >
                <step.icon className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


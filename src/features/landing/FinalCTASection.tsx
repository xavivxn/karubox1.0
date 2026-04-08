"use client";

import { ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getWhatsAppHref } from "@/lib/whatsapp";

export default function FinalCTASection() {
  const wa = getWhatsAppHref();

  return (
    <section
      id="contact"
      className="py-20 md:py-32 bg-gradient-to-br from-primary via-primary-dark to-secondary"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
            ¿Listo para transformar tu negocio gastronómico?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            ¿Cansado de gestionar tu negocio gastronómico con múltiples
            herramientas?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white text-primary px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold text-xl shadow-[0_8px_28px_rgba(0,0,0,0.12)] hover:shadow-[0_0_40px_rgba(238,95,15,0.45)] hover:scale-105 flex items-center justify-center gap-2"
            >
              Agendar Asesoría por WhatsApp
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="group border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-300 font-semibold text-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              Hablar con un experto
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

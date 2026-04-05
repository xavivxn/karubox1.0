"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          onClick={scrollToTop}
          className="fixed bottom-[11rem] right-4 z-[90] w-11 h-11 sm:bottom-[5.75rem] sm:right-5 sm:w-12 sm:h-12 bg-white text-primary rounded-full shadow-lg border-2 border-primary hover:bg-primary/5 transition-colors flex items-center justify-center hover:scale-110 transition-transform md:right-6"
          aria-label="Volver arriba"
        >
          <ArrowUp className="w-6 h-6 text-primary" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}


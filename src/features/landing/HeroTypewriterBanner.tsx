"use client";

import { useEffect, useState } from "react";

const PREFIX = "¿Cansado de gestionar tu negocio gastronómico";
const SUFFIXES = [
  " con cuadernos que se pierden?",
  " con tickets que no se entienden?",
  " con faltantes en tu inventario?",
];

function sleep(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}

/**
 * Bloque naranja con typewriter. Cuando incorpores el video, este contenedor
 * puede actuar como “marco” alrededor del reproductor (misma envoltura + padding).
 */
export default function HeroTypewriterBanner() {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      while (!cancelled) {
        for (const suffix of SUFFIXES) {
          if (cancelled) return;
          for (let i = 0; i <= suffix.length; i++) {
            if (cancelled) return;
            setDisplayed(suffix.slice(0, i));
            await sleep(38);
          }
          await sleep(2600);
          for (let i = suffix.length; i >= 0; i--) {
            if (cancelled) return;
            setDisplayed(suffix.slice(0, i));
            await sleep(26);
          }
          await sleep(400);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative w-full mt-4 md:mt-6 -mb-px">
      {/* Onda sutil: transición crema/claro → bloque naranja */}
      <div
        className="relative w-full h-10 md:h-14 overflow-hidden leading-[0] text-[#fdfcfa] dark:text-gray-900"
        aria-hidden
      >
        <svg
          className="absolute bottom-0 left-0 h-full w-[140%] -translate-x-[12%] md:w-full md:translate-x-0"
          viewBox="0 0 1440 56"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,40 C240,8 480,52 720,28 C960,4 1200,48 1440,22 L1440,56 L0,56 Z"
          />
        </svg>
      </div>

      <div className="relative overflow-hidden shadow-[0_-8px_40px_-12px_rgba(249,115,22,0.35)] ring-1 ring-white/20">
        <div className="bg-gradient-to-r from-primary via-primary-dark to-secondary px-4 sm:px-6 py-12 md:py-14 text-center">
          <div className="mx-auto max-w-4xl rounded-2xl bg-black/10 px-4 py-8 md:px-8 md:py-10 ring-1 ring-white/15 backdrop-blur-[2px]">
            <p className="text-base md:text-lg lg:text-xl font-medium text-white/95 min-h-[4rem] md:min-h-[4.5rem] flex items-center justify-center px-2 font-sans leading-relaxed">
              <span className="text-balance">
                {PREFIX}
                <span className="font-semibold text-white">{displayed}</span>
                <span
                  className="inline-block w-0.5 h-[1.05em] ml-1 bg-white/85 animate-pulse align-middle"
                  aria-hidden
                />
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

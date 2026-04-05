"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getWhatsAppHref } from "@/lib/whatsapp";

export default function MobileStickyWhatsApp() {
  const [visible, setVisible] = useState(false);
  const wa = getWhatsAppHref();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[96] md:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="px-3 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 pb-1">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-lg font-semibold text-white shadow-[0_4px_24px_rgba(238,95,15,0.45)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_6px_32px_rgba(238,95,15,0.55)]"
        >
          Agendar Asesoría por WhatsApp
          <ArrowRight className="h-5 w-5 shrink-0" />
        </a>
      </div>
    </div>
  );
}

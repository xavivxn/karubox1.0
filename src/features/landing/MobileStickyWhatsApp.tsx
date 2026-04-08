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

  const safeBarStyle = {
    paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
    paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
    paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
  } as const;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[96] md:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
      style={safeBarStyle}
    >
      <div className="pointer-events-none pb-1 pt-2">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-lg font-semibold text-white transition-shadow duration-300 [-webkit-tap-highlight-color:transparent] shadow-[0_4px_20px_rgba(0,0,0,0.22)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.28)] active:shadow-[0_2px_12px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          Agendar Asesoría por WhatsApp
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
        </a>
      </div>
    </div>
  );
}

"use client";

import { Play } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** MP4 temporal en `public/videos/`; sustituir por el demo oficial cuando esté listo. */
const DEMO_VIDEO_SRC = "/videos/demo-placeholder.mp4";

type DemoVideoCardProps = {
  className?: string;
  playIconRef?: React.RefObject<HTMLDivElement | null>;
};

const DemoVideoCard = forwardRef<HTMLDivElement, DemoVideoCardProps>(
  function DemoVideoCard({ className, playIconRef }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl overflow-hidden",
          "border border-white/[0.35] dark:border-white/15",
          "bg-gradient-to-br from-white/[0.08] to-white/[0.02] dark:from-white/10 dark:to-white/[0.03]",
          "backdrop-blur-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(238,95,15,0.06)]",
          "dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
          "ring-1 ring-black/[0.04] dark:ring-white/10",
          className
        )}
      >
        <div className="relative aspect-video bg-black">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
            aria-label="Video de referencia: programa de fidelidad digital"
          >
            <source src={DEMO_VIDEO_SRC} type="video/mp4" />
          </video>
          {playIconRef ? (
            <div
              ref={playIconRef}
              className="pointer-events-none absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 dark:bg-primary/30 md:bottom-4 md:right-4 md:h-14 md:w-14"
              aria-hidden
            >
              <Play
                className="h-5 w-5 text-primary md:h-7 md:w-7"
                strokeWidth={2}
              />
            </div>
          ) : null}
        </div>
        <div className="border-t border-white/10 dark:border-white/10 px-4 py-3 md:px-5 md:py-3.5">
          <p className="text-center text-xs font-medium text-gray-600 dark:text-gray-300 md:text-sm">
            Video de referencia mientras preparamos el demo oficial de KarúBox
          </p>
        </div>
      </div>
    );
  }
);

export default DemoVideoCard;

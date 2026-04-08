"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** No animar si el usuario prefiere menos movimiento */
  disabled?: boolean;
  className?: string;
};

/**
 * Fuegos artificiales suaves detrás de la tarjeta de precio (canvas + blend).
 */
export function PricingFireworks({ disabled, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (disabled) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = ctx;

    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      color: string;
    };

    type Rocket = {
      x: number;
      y: number;
      vy: number;
      targetY: number;
      color: string;
    };

    const colors = ["#fbbf24", "#f97316", "#fde68a", "#fff7ed", "#fb923c"];
    let particles: Particle[] = [];
    let rockets: Rocket[] = [];
    /** Primer oleada casi al cargar */
    let lastSpawn = performance.now() - 5000;
    let last = performance.now();

    const MAX_PARTICLES = 2400;

    function pushParticle(
      x: number,
      y: number,
      vx: number,
      vy: number,
      maxLife: number,
      color: string
    ) {
      if (particles.length >= MAX_PARTICLES) return;
      particles.push({
        x,
        y,
        vx,
        vy,
        life: 0,
        max: maxLife,
        color,
      });
    }

    /** Varios cohetes por oleada para llenar el cielo */
    function spawnWave() {
      const wave = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < wave; i++) {
        rockets.push({
          x: w * (0.12 + Math.random() * 0.76),
          y: h + 10 + i * 18,
          vy: -9.5 - Math.random() * 6,
          targetY: h * (0.08 + Math.random() * 0.32),
          color: colors[Math.floor(Math.random() * colors.length)]!,
        });
      }
    }

    function explode(x: number, y: number, color: string) {
      const n = 72 + Math.floor(Math.random() * 56);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.45;
        const v = 1.9 + Math.random() * 4.4;
        pushParticle(
          x,
          y,
          Math.cos(a) * v,
          Math.sin(a) * v,
          36 + Math.random() * 44,
          i % 5 === 0 ? "#ffffff" : color
        );
      }
      /* Segundo anillo más denso (más “fuegos”) */
      const n2 = 36 + Math.floor(Math.random() * 28);
      const color2 = colors[Math.floor(Math.random() * colors.length)]!;
      for (let i = 0; i < n2; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 1.2 + Math.random() * 2.8;
        pushParticle(
          x + (Math.random() - 0.5) * 10,
          y + (Math.random() - 0.5) * 10,
          Math.cos(a) * v,
          Math.sin(a) * v,
          28 + Math.random() * 32,
          i % 3 === 0 ? "#fef3c7" : color2
        );
      }
    }

    function frame(now: number) {
      const dt = Math.min(32, now - last);
      last = now;
      c.clearRect(0, 0, w, h);
      c.globalCompositeOperation = "lighter";

      /* Oleadas seguidas; a veces dos oleadas seguidas */
      if (now - lastSpawn > 480 + Math.random() * 650) {
        spawnWave();
        if (Math.random() < 0.28) spawnWave();
        lastSpawn = now;
      }

      rockets = rockets.filter((r) => {
        r.y += r.vy * (dt / 16);
        r.vy += 0.12 * (dt / 16);
        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          return false;
        }
        c.globalAlpha = 1;
        c.fillStyle = r.color;
        c.beginPath();
        c.arc(r.x, r.y, 2.6, 0, Math.PI * 2);
        c.fill();
        return r.y > -40;
      });

      particles = particles.filter((p) => {
        p.life += dt;
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.vy += 0.08 * (dt / 16);
        const alpha = 1 - p.life / p.max;
        if (alpha <= 0) return false;
        c.globalAlpha = alpha * 0.95;
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        c.fill();
        return p.life < p.max;
      });

      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <canvas
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-0 z-0 h-full w-full",
        className
      )}
      aria-hidden
    />
  );
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from 'framer-motion'
import type { Achievement } from '../utils/achievements'

/* ════════════════════════════════════════
   FLOATING STAR BACKGROUND
════════════════════════════════════════ */
const STAR_CONFIGS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  top: `${(i * 37 + 11) % 95}%`,
  left: `${(i * 53 + 7) % 95}%`,
  size: 8 + ((i * 3) % 14),
  delay: `${(i * 0.31) % 3.5}s`,
  duration: `${2.4 + (i % 4) * 0.6}s`,
  char: ['✦', '✧', '★', '✦', '✴'][i % 5],
  color: [
    'rgba(167,139,250,0.7)',
    'rgba(236,72,153,0.6)',
    'rgba(59,130,246,0.7)',
    'rgba(6,182,212,0.6)',
    'rgba(245,158,11,0.6)',
  ][i % 5],
}))

function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STAR_CONFIGS.map((s) => (
        <span
          key={s.id}
          className="absolute animate-float-star"
          style={{
            top: s.top,
            left: s.left,
            fontSize: `${s.size}px`,
            color: s.color,
            animationDelay: s.delay,
            animationDuration: s.duration,
            textShadow: `0 0 8px ${s.color}`,
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════
   HOLO CARD (grande, con tilt 3D)
════════════════════════════════════════ */
const SPARKLE_POSITIONS = [
  { top: '8%',  left: '10%', delay: '0s',    size: 14 },
  { top: '15%', left: '82%', delay: '0.5s',  size: 11 },
  { top: '50%', left: '92%', delay: '1.0s',  size: 16 },
  { top: '78%', left: '12%', delay: '1.5s',  size: 12 },
  { top: '88%', left: '65%', delay: '0.3s',  size: 10 },
  { top: '35%', left: '4%',  delay: '2.0s',  size: 13 },
  { top: '62%', left: '50%', delay: '0.8s',  size: 9  },
  { top: '25%', left: '55%', delay: '1.8s',  size: 11 },
]

function HoloCard({ achievement }: { achievement: Achievement }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  const rotateX = useSpring(useTransform(rawY, [-1, 1], [14, -14]), { stiffness: 200, damping: 30 })
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-14, 14]), { stiffness: 200, damping: 30 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1
    rawX.set(x)
    rawY.set(y)
  }, [rawX, rawY])

  const handleMouseLeave = useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        width: 'clamp(180px, 30vw, 300px)',
        aspectRatio: '280 / 380',
        maxHeight: 'calc(var(--showcase-vh, 1vh) * 52)',
        border: '2px solid transparent',
        background: 'linear-gradient(#0f0c24, #0f0c24) padding-box, linear-gradient(135deg, #f43f5e, #a855f7, #3b82f6, #06b6d4, #10b981, #f59e0b, #f43f5e) border-box',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-3xl overflow-hidden cursor-pointer select-none animate-holo-glow"
      initial={{ scale: 0, rotate: -18, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.52, duration: 0.7 }}
    >
      {/* Rainbow holo gradient layer */}
      <div
        className="absolute inset-0 animate-holo-gradient opacity-30 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #f43f5e 0%, #a855f7 16%, #3b82f6 33%, #06b6d4 50%, #10b981 66%, #f59e0b 83%, #f43f5e 100%)',
          backgroundSize: '300% 300%',
        }}
      />

      {/* Sheen sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 animate-holo-sheen"
          style={{
            background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.65) 50%, transparent 75%)',
            width: '55%',
            left: '22%',
          }}
        />
      </div>

      {/* Sparkles */}
      {SPARKLE_POSITIONS.map((s, i) => (
        <span
          key={i}
          className="absolute animate-holo-pop pointer-events-none text-white"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            animationDelay: s.delay,
            textShadow: '0 0 8px #fff, 0 0 20px #a78bfa',
            lineHeight: 1,
          }}
        >
          ✦
        </span>
      ))}

      {/* Card content */}
      <div className="relative z-[1] h-full flex flex-col items-center justify-center p-4 sm:p-5 gap-2 sm:gap-2.5">
        {/* Tier badge */}
        <span
          className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #a855f7, #3b82f6, #06b6d4)',
            color: '#fff',
          }}
        >
          ✦ Diamante ✦
        </span>

        {/* Emoji */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl sm:text-6xl"
          style={{ filter: 'drop-shadow(0 0 16px rgba(167,139,250,0.9))' }}
        >
          {achievement.emoji}
        </motion.div>

        {/* Name */}
        <h2
          className="text-lg sm:text-xl md:text-2xl font-black text-center text-white leading-tight"
          style={{ textShadow: '0 0 20px rgba(167,139,250,0.8)' }}
        >
          {achievement.name}
        </h2>

        {/* Description */}
        <p className="text-xs sm:text-sm text-purple-200 text-center leading-snug opacity-90">
          {achievement.description}
        </p>

        {/* Karúbox logo text */}
        <div className="mt-auto flex items-center gap-1.5 opacity-60">
          <span className="text-[10px] font-bold tracking-widest text-purple-300 uppercase">
            Karúbox
          </span>
          <span className="text-purple-400 text-[10px]">✦</span>
          <span className="text-[10px] text-purple-300 font-medium">Cocina en Vivo</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════
   COPY BUTTON
════════════════════════════════════════ */
function CopyButton({ achievement, tenantNombre }: { achievement: Achievement; tenantNombre: string }) {
  const [copied, setCopied] = useState(false)

  const message = useMemo(() => {
    const clean = tenantNombre.replace(/\s+/g, '')
    return `🏆 ¡Logramos "${achievement.name}" en Karúbox! ${achievement.emoji}💎\n¿Qué es? ${achievement.description}\n\n#Karúbox #${clean} #CocinaEnVivo #KitchenGoals`
  }, [achievement, tenantNombre])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // fallback: select
    }
  }, [message])

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.04, y: -1 }}
      className="group relative overflow-hidden rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 font-black text-white text-[11px] sm:text-xs flex items-center justify-center gap-2 shadow-xl w-[min(290px,88vw)] text-center border border-white/25"
      style={{
        background: copied
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : 'linear-gradient(135deg, #f43f5e, #a855f7, #3b82f6)',
        backgroundSize: '200% 200%',
        transition: 'background 0.3s',
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)',
          transform: 'translateX(-120%)',
          animation: 'holo-sheen 1.8s linear infinite',
        }}
      />
      <span>{copied ? '✅' : '📸'}</span>
      <span>{copied ? '¡Copiado! Pegalo en Instagram' : 'Compartir logro en redes'}</span>
    </motion.button>
  )
}

/* ════════════════════════════════════════
   MAIN SHOWCASE
════════════════════════════════════════ */
export default function DiamondTrophyShowcase({
  achievement,
  tenantNombre,
  onClose,
}: {
  achievement: Achievement | null
  tenantNombre: string
  onClose: () => void
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!achievement) return

    const setViewportVars = () => {
      const vv = window.visualViewport
      const viewportHeight = vv?.height ?? window.innerHeight
      const viewportWidth = vv?.width ?? window.innerWidth
      document.documentElement.style.setProperty('--showcase-vh', `${viewportHeight * 0.01}px`)
      document.documentElement.style.setProperty('--showcase-vw', `${viewportWidth * 0.01}px`)
    }

    setViewportVars()

    window.addEventListener('resize', setViewportVars)
    window.visualViewport?.addEventListener('resize', setViewportVars)
    window.visualViewport?.addEventListener('scroll', setViewportVars)

    return () => {
      window.removeEventListener('resize', setViewportVars)
      window.visualViewport?.removeEventListener('resize', setViewportVars)
      window.visualViewport?.removeEventListener('scroll', setViewportVars)
      document.documentElement.style.removeProperty('--showcase-vh')
      document.documentElement.style.removeProperty('--showcase-vw')
    }
  }, [achievement])

  useEffect(() => {
    if (!achievement) return

    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    const prevBodyTouchAction = document.body.style.touchAction

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      document.body.style.touchAction = prevBodyTouchAction
    }
  }, [achievement])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!isMounted) return null

  return createPortal(
    <AnimatePresence>
      {achievement && (
        <motion.div
          key="showcase"
          className="fixed inset-0 z-[2147483647] flex flex-col items-center justify-center gap-3 sm:gap-5 overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, #1e0a3c 0%, #0a0618 50%, #000 100%)',
            width: 'calc(var(--showcase-vw, 1vw) * 100)',
            height: 'calc(var(--showcase-vh, 1vh) * 100)',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Starfield */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="absolute inset-0"
          >
            <StarField />
          </motion.div>

          {/* Close backdrop click */}
          <div className="absolute inset-0 z-0" onClick={onClose} />

          {/* Main card */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: 0.25, ease: 'easeOut' }}
          >
            <div
              className="absolute inset-[-22px] rounded-[32px] pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 45%, rgba(168,85,247,0.32), rgba(59,130,246,0.14), rgba(14,6,30,0))',
                filter: 'blur(16px)',
              }}
            />
            <HoloCard achievement={achievement} />
          </motion.div>

          {/* Text block */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, type: 'spring', bounce: 0.24 }}
            className="relative z-10 text-center px-4 sm:px-6 space-y-1 sm:space-y-1.5"
          >
            <p
              className="text-[26px] sm:text-3xl md:text-4xl font-black text-white leading-tight"
              style={{ textShadow: '0 0 28px rgba(167,139,250,0.78)' }}
            >
              ¡Sos una leyenda, {tenantNombre}! 🏆
            </p>
            <p className="text-sm sm:text-base text-purple-200 max-w-[320px] sm:max-w-md mx-auto leading-relaxed font-medium">
              Karúbox te felicita. Este logro es tuyo.
              <br />
              Presumilo en tus redes y que todos lo vean.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.86, type: 'spring', bounce: 0.24 }}
            className="relative z-10 flex flex-col items-center gap-1 sm:gap-1.5"
          >
            <CopyButton achievement={achievement} tenantNombre={tenantNombre} />

            <button
              onClick={onClose}
              className="text-[11px] sm:text-sm text-purple-300/90 hover:text-purple-100 transition-all font-semibold hover:tracking-wide"
            >
              × Cerrar
            </button>
          </motion.div>

          {/* Corner tag */}
          <div
            className="fixed z-10 opacity-30"
            style={{
              bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
              right: 'calc(1.25rem + env(safe-area-inset-right, 0px))',
            }}
          >
            <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">
              Karúbox © Cocina en Vivo
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  , document.body)
}

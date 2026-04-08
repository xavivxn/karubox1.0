'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * Siluetas de comida para el fondo del login: pizza, hamburguesa, kebab, helado, etc.
 * SVG en blanco con baja opacidad; el contenedor externo fija posición y rotación,
 * el SVG anima translate (deriva) para no pisarse con transform del padre.
 */
type SilhouetteItem = {
  path: string
  viewBox: string
  wrapClass: string
  svgClass: string
  rotateClass?: string
  drift: 0 | 1 | 2 | 3
  /** segundos, ligeramente distintos para que no vayan sincronizadas */
  durationSec: number
  /** negativo = ya “en marcha” al cargar */
  delaySec: number
}

const SILHOUETTES: SilhouetteItem[] = [
  {
    path: 'M12 2L22 22H2L12 2z',
    viewBox: '0 0 24 24',
    wrapClass: 'top-[6%] left-[6%]',
    svgClass: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 opacity-[0.09]',
    drift: 0,
    durationSec: 26,
    delaySec: 0,
  },
  {
    path: 'M12 2L22 22H2L12 2z',
    viewBox: '0 0 24 24',
    wrapClass: 'top-[22%] right-[10%]',
    svgClass: 'w-14 h-14 sm:w-16 sm:h-16 opacity-[0.07]',
    rotateClass: 'rotate-12',
    drift: 1,
    durationSec: 31,
    delaySec: -4,
  },
  {
    path: 'M4 6h16c.5 0 1 .4 1 1v1H3V7c0-.6.5-1 1-1zm-1 4h18v2H3v-2zm0 6h18v1c0 .6-.5 1-1 1H4c-.5 0-1-.4-1-1v-1z',
    viewBox: '0 0 24 24',
    wrapClass: 'bottom-[22%] left-[7%]',
    svgClass: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-[0.08]',
    drift: 2,
    durationSec: 24,
    delaySec: -2,
  },
  {
    path: 'M4 6h16c.5 0 1 .4 1 1v1H3V7c0-.6.5-1 1-1zm-1 4h18v2H3v-2zm0 6h18v1c0 .6-.5 1-1 1H4c-.5 0-1-.4-1-1v-1z',
    viewBox: '0 0 24 24',
    wrapClass: 'top-[58%] right-[5%]',
    svgClass: 'w-11 h-11 sm:w-12 sm:h-12 opacity-[0.06]',
    rotateClass: '-rotate-6',
    drift: 3,
    durationSec: 29,
    delaySec: -7,
  },
  {
    path: 'M12 2c-2.2 0-4 2.2-4 5s1.8 5 4 5 4-2.2 4-5-1.8-5-4-5zm0 8c-1.5 0-2.5-1.2-2.5-3s1-3 2.5-3 2.5 1.2 2.5 3-1 3-2.5 3z',
    viewBox: '0 0 24 24',
    wrapClass: 'top-[10%] right-[28%]',
    svgClass: 'w-10 h-10 sm:w-12 sm:h-12 opacity-[0.07]',
    drift: 0,
    durationSec: 28,
    delaySec: -5,
  },
  {
    path: 'M12 2c-1.5 0-2.5 1.3-2.5 3s1 3 2.5 3 2.5-1.3 2.5-3-1-3-2.5-3zm0 5l-5 10h10L12 7z',
    viewBox: '0 0 24 24',
    wrapClass: 'bottom-[38%] right-[16%]',
    svgClass: 'w-16 h-16 sm:w-18 sm:h-18 opacity-[0.08]',
    drift: 1,
    durationSec: 23,
    delaySec: -1,
  },
  {
    path: 'M12 2c-1.5 0-2.5 1.3-2.5 3s1 3 2.5 3 2.5-1.3 2.5-3-1-3-2.5-3zm0 5l-5 10h10L12 7z',
    viewBox: '0 0 24 24',
    wrapClass: 'bottom-[6%] left-[20%]',
    svgClass: 'w-12 h-12 sm:w-14 sm:h-14 opacity-[0.06]',
    rotateClass: '-rotate-12',
    drift: 2,
    durationSec: 32,
    delaySec: -9,
  },
  {
    path: 'M6 2h12v5c0 2.5-1.5 4-4 4h-4c-2.5 0-4-1.5-4-4V2zm0 7v6c0 1.5 1 2.5 3 2.5h6c2 0 3-1 3-2.5V9H6zm0 9v2h12v-2H6z',
    viewBox: '0 0 24 24',
    wrapClass: 'top-[42%] left-[2%]',
    svgClass: 'w-12 h-12 sm:w-14 sm:h-14 opacity-[0.06]',
    drift: 3,
    durationSec: 27,
    delaySec: -3,
  },
  {
    path: 'M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm2 4h10v2H7v-2z',
    viewBox: '0 0 24 24',
    wrapClass: 'bottom-[10%] right-[26%]',
    svgClass: 'w-16 h-16 sm:w-20 sm:h-20 opacity-[0.07]',
    drift: 0,
    durationSec: 25,
    delaySec: -6,
  },
  {
    path: 'M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm2 4h10v2H7v-2z',
    viewBox: '0 0 24 24',
    wrapClass: 'top-[72%] left-[12%]',
    svgClass: 'w-10 h-10 sm:w-12 sm:h-12 opacity-[0.05]',
    rotateClass: 'rotate-[-8deg]',
    drift: 1,
    durationSec: 30,
    delaySec: -8,
  },
  {
    path: 'M8 3h8l1 10c0 1.5-.5 3-2 4H9c-1.5-1-2-2.5-2-4L8 3zm0 15h8v2H8v-2z',
    viewBox: '0 0 24 24',
    wrapClass: 'top-[35%] right-[3%]',
    svgClass: 'w-12 h-12 sm:w-14 sm:h-14 opacity-[0.06]',
    drift: 2,
    durationSec: 22,
    delaySec: -4,
  },
  {
    path: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z',
    viewBox: '0 0 24 24',
    wrapClass: 'bottom-[48%] left-[10%]',
    svgClass: 'w-14 h-14 sm:w-16 sm:h-16 opacity-[0.07]',
    drift: 3,
    durationSec: 33,
    delaySec: -2,
  },
]

const driftClass = (d: 0 | 1 | 2 | 3) =>
  d === 0
    ? 'animate-login-bg-shape-0'
    : d === 1
      ? 'animate-login-bg-shape-1'
      : d === 2
        ? 'animate-login-bg-shape-2'
        : 'animate-login-bg-shape-3'

export function LoginBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-18%,hsl(var(--primary)_/_0.1),transparent_55%)]" />
      <div className="absolute -left-24 top-1/4 h-[22rem] w-[22rem] rounded-full bg-orange-500/[0.08] blur-[90px]" />
      <div className="absolute -right-20 bottom-1/4 h-[18rem] w-[18rem] rounded-full bg-amber-500/[0.06] blur-[80px]" />
      <div
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_45%,black,transparent)]"
        aria-hidden
      />
      {SILHOUETTES.map((item, i) => (
        <div
          key={i}
          className={cn('absolute will-change-transform', item.wrapClass, item.rotateClass)}
        >
          <svg
            viewBox={item.viewBox}
            className={cn('block fill-white will-change-transform', item.svgClass, driftClass(item.drift))}
            style={
              {
                '--login-bg-drift-dur': `${item.durationSec}s`,
                animationDelay: `${item.delaySec}s`,
              } as CSSProperties
            }
            preserveAspectRatio="xMidYMid meet"
          >
            <path d={item.path} />
          </svg>
        </div>
      ))}
    </div>
  )
}

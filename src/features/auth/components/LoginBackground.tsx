'use client'

/**
 * Siluetas de comida para el fondo del login: pizza, hamburguesa, kebab, helado, etc.
 * SVG en blanco con baja opacidad sobre fondo oscuro.
 */
const SILHOUETTES = [
  /* Pizza (porción en triángulo) */
  {
    path: 'M12 2L22 22H2L12 2z',
    viewBox: '0 0 24 24',
    className: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 top-[6%] left-[6%] opacity-[0.09]',
  },
  {
    path: 'M12 2L22 22H2L12 2z',
    viewBox: '0 0 24 24',
    className: 'w-14 h-14 sm:w-16 sm:h-16 top-[22%] right-[10%] opacity-[0.07] rotate-12',
  },
  /* Hamburguesa (pan arriba + rectángulo + pan abajo) */
  {
    path: 'M4 6h16c.5 0 1 .4 1 1v1H3V7c0-.6.5-1 1-1zm-1 4h18v2H3v-2zm0 6h18v1c0 .6-.5 1-1 1H4c-.5 0-1-.4-1-1v-1z',
    viewBox: '0 0 24 24',
    className: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bottom-[22%] left-[7%] opacity-[0.08]',
  },
  {
    path: 'M4 6h16c.5 0 1 .4 1 1v1H3V7c0-.6.5-1 1-1zm-1 4h18v2H3v-2zm0 6h18v1c0 .6-.5 1-1 1H4c-.5 0-1-.4-1-1v-1z',
    viewBox: '0 0 24 24',
    className: 'w-11 h-11 sm:w-12 sm:h-12 top-[58%] right-[5%] opacity-[0.06] -rotate-6',
  },
  /* Kebab / pincho (elipse vertical) */
  {
    path: 'M12 2c-2.2 0-4 2.2-4 5s1.8 5 4 5 4-2.2 4-5-1.8-5-4-5zm0 8c-1.5 0-2.5-1.2-2.5-3s1-3 2.5-3 2.5 1.2 2.5 3-1 3-2.5 3z',
    viewBox: '0 0 24 24',
    className: 'w-10 h-10 sm:w-12 sm:h-12 top-[10%] right-[28%] opacity-[0.07]',
  },
  /* Helado (bola + cono) */
  {
    path: 'M12 2c-1.5 0-2.5 1.3-2.5 3s1 3 2.5 3 2.5-1.3 2.5-3-1-3-2.5-3zm0 5l-5 10h10L12 7z',
    viewBox: '0 0 24 24',
    className: 'w-16 h-16 sm:w-18 sm:h-18 bottom-[38%] right-[16%] opacity-[0.08]',
  },
  {
    path: 'M12 2c-1.5 0-2.5 1.3-2.5 3s1 3 2.5 3 2.5-1.3 2.5-3-1-3-2.5-3zm0 5l-5 10h10L12 7z',
    viewBox: '0 0 24 24',
    className: 'w-12 h-12 sm:w-14 sm:h-14 bottom-[6%] left-[20%] opacity-[0.06] -rotate-12',
  },
  /* Copa / bebida */
  {
    path: 'M6 2h12v5c0 2.5-1.5 4-4 4h-4c-2.5 0-4-1.5-4-4V2zm0 7v6c0 1.5 1 2.5 3 2.5h6c2 0 3-1 3-2.5V9H6zm0 9v2h12v-2H6z',
    viewBox: '0 0 24 24',
    className: 'w-12 h-12 sm:w-14 sm:h-14 top-[42%] left-[2%] opacity-[0.06]',
  },
  /* Lomito / sándwich (rectángulo redondeado) */
  {
    path: 'M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm2 4h10v2H7v-2z',
    viewBox: '0 0 24 24',
    className: 'w-16 h-16 sm:w-20 sm:h-20 bottom-[10%] right-[26%] opacity-[0.07]',
  },
  {
    path: 'M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm2 4h10v2H7v-2z',
    viewBox: '0 0 24 24',
    className: 'w-10 h-10 sm:w-12 sm:h-12 top-[72%] left-[12%] opacity-[0.05] rotate-[-8deg]',
  },
  /* Papas fritas (cono/paquete) */
  {
    path: 'M8 3h8l1 10c0 1.5-.5 3-2 4H9c-1.5-1-2-2.5-2-4L8 3zm0 15h8v2H8v-2z',
    viewBox: '0 0 24 24',
    className: 'w-12 h-12 sm:w-14 sm:h-14 top-[35%] right-[3%] opacity-[0.06]',
  },
  /* Donut */
  {
    path: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z',
    viewBox: '0 0 24 24',
    className: 'w-14 h-14 sm:w-16 sm:h-16 bottom-[48%] left-[10%] opacity-[0.07]',
  },
]

export function LoginBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(249,115,22,0.12),transparent_50%)]" />
      {SILHOUETTES.map((item, i) => (
        <svg
          key={i}
          viewBox={item.viewBox}
          className={`absolute fill-white ${item.className}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <path d={item.path} />
        </svg>
      ))}
    </div>
  )
}

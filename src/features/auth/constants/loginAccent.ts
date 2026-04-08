/**
 * Acento ámbar / naranja para login: grillas y halos (columna valor = ámbar oscuro).
 */

/** Primera grilla (panel izquierdo): líneas ámbar oscuro tipo neón profundo. */
export const loginNeonGridDeepAmber = [
  'bg-[linear-gradient(rgba(120,53,15,0.42)_1px,transparent_1px),linear-gradient(90deg,rgba(120,53,15,0.42)_1px,transparent_1px)]',
  'bg-[size:40px_40px]',
].join(' ')

/** Segunda grilla (formulario): ámbar medio, coherente pero menos pesada. */
export const loginNeonGridAmber = [
  'bg-[linear-gradient(rgba(217,119,6,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(217,119,6,0.14)_1px,transparent_1px)]',
  'bg-[size:40px_40px]',
].join(' ')

export const loginNeonGridMask =
  'opacity-85 [mask-image:radial-gradient(ellipse_92%_82%_at_50%_50%,black,transparent)]'

export const loginColumnNeonInset =
  'shadow-[inset_0_0_48px_-12px_rgba(180,83,9,0.14),inset_0_0_0_1px_rgba(146,64,14,0.14)]'

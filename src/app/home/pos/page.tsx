import POSPageClient from './POSPageClient'

// Página síncrona para evitar round-trip RSC (pos?_rsc=...); la verificación de rol se hace en el cliente.
export default function POSPage() {
  return <POSPageClient />
}

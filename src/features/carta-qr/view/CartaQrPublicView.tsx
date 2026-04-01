'use client'

import { useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import { Loader2, Store, Phone, MapPin, Sparkles } from 'lucide-react'
import { registerClienteFromCartaQr } from '@/app/actions/carta-qr'

export interface CartaQrTenantData {
  id: string
  nombre: string
  slug: string
  logo_url: string | null
  direccion: string | null
  telefono: string | null
}

export interface CartaQrCategoryData {
  id: string
  nombre: string
}

export interface CartaQrProductData {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria_id: string | null
  imagen_url: string | null
}

interface Props {
  tenant: CartaQrTenantData
  categories: CartaQrCategoryData[]
  products: CartaQrProductData[]
}

const money = new Intl.NumberFormat('es-PY')

const inputClass =
  'w-full rounded-xl border border-white/30 bg-white/85 px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/70'

export default function CartaQrPublicView({ tenant, categories, products }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [registerError, setRegisterError] = useState('')
  const [registerOk, setRegisterOk] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    ci: '',
    ruc: '',
    email: '',
    direccion: '',
    fecha_nacimiento: '',
  })

  const grouped = useMemo(() => {
    const visible =
      selectedCategory === 'all'
        ? products
        : products.filter((p) => (p.categoria_id ?? '') === selectedCategory)

    if (selectedCategory !== 'all') {
      const cat = categories.find((c) => c.id === selectedCategory)
      return [{ id: selectedCategory, nombre: cat?.nombre ?? 'Categoria', productos: visible }]
    }

    return categories
      .map((cat) => ({
        id: cat.id,
        nombre: cat.nombre,
        productos: visible.filter((p) => p.categoria_id === cat.id),
      }))
      .filter((x) => x.productos.length > 0)
  }, [categories, products, selectedCategory])

  const uncategorized = useMemo(
    () => (selectedCategory === 'all' ? products.filter((p) => !p.categoria_id) : []),
    [products, selectedCategory]
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')
    setRegisterOk('')
    startTransition(async () => {
      const result = await registerClienteFromCartaQr({
        tenantId: tenant.id,
        pasaporte: '',
        ...form,
      })
      if (!result.ok) {
        setRegisterError(result.error ?? 'No se pudo registrar')
        return
      }
      setRegisterOk(
        result.created
          ? 'Listo. Ya quedaste registrado y en caja te van a poder encontrar.'
          : 'No se pudo completar el registro.'
      )
      if (result.created) {
        setForm({
          nombre: '',
          telefono: '',
          ci: '',
          ruc: '',
          email: '',
          direccion: '',
          fecha_nacimiento: '',
        })
      }
    })
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-100 via-amber-50 to-white text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-orange-200/80 bg-gradient-to-br from-white/92 via-orange-50/95 to-amber-100/80 p-5 shadow-[0_12px_40px_-18px_rgba(249,115,22,0.45)] sm:p-8">
          <div className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-orange-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-yellow-200/30 blur-3xl" />
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-3 py-1 text-xs font-semibold tracking-wide text-orange-700">
                <Store className="h-3.5 w-3.5" />
                Carta QR
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-4xl">
                {tenant.nombre}
              </h1>
              <p className="max-w-2xl text-sm text-gray-600 sm:text-base">
                Bienvenido. Esta carta muestra todo lo disponible en el local para que elijas tranquilo.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 sm:text-sm">
                {tenant.direccion && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1">
                    <MapPin className="h-3.5 w-3.5 text-orange-600" />
                    {tenant.direccion}
                  </span>
                )}
                {tenant.telefono && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1">
                    <Phone className="h-3.5 w-3.5 text-orange-600" />
                    {tenant.telefono}
                  </span>
                )}
              </div>
            </div>
            <div className="justify-self-start sm:justify-self-end">
              {tenant.logo_url ? (
                <Image
                  src={tenant.logo_url}
                  alt={`Logo ${tenant.nombre}`}
                  width={128}
                  height={128}
                  className="h-24 w-24 rounded-2xl border border-white/70 object-cover shadow-lg sm:h-28 sm:w-28"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-3xl shadow-lg sm:h-28 sm:w-28">
                  🍔
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-3xl border border-orange-100 bg-white/90 p-4 shadow-[0_10px_34px_-20px_rgba(249,115,22,0.45)] sm:p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === 'all'
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-orange-200 bg-white text-orange-700 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                Todo el menu
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === cat.id
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-orange-200 bg-white text-orange-700 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            <div className="space-y-7">
              {grouped.map((group) => (
                <div key={group.id} className="space-y-3">
                  <h2 className="text-sm font-black uppercase tracking-wide text-orange-700">{group.nombre}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.productos.map((producto) => (
                      <article
                        key={producto.id}
                        className="group overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/55 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex gap-3">
                          {producto.imagen_url ? (
                            <Image
                              src={producto.imagen_url}
                              alt={producto.nombre}
                              width={72}
                              height={72}
                              className="h-[72px] w-[72px] rounded-xl border border-orange-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-white text-2xl">
                              🍽️
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-extrabold text-gray-900">{producto.nombre}</h3>
                            {producto.descripcion && (
                              <p className="mt-1 line-clamp-2 text-xs text-gray-600">{producto.descripcion}</p>
                            )}
                            <p className="mt-2 text-sm font-black text-orange-700">
                              Gs. {money.format(Math.round(Number(producto.precio) || 0))}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}

              {uncategorized.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-black uppercase tracking-wide text-orange-700">Otros</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {uncategorized.map((producto) => (
                      <article key={producto.id} className="rounded-2xl border border-orange-100 bg-white p-3">
                        <h3 className="text-sm font-bold text-gray-900">{producto.nombre}</h3>
                        <p className="mt-1 text-xs text-gray-600">{producto.descripcion}</p>
                        <p className="mt-2 text-sm font-black text-orange-700">
                          Gs. {money.format(Math.round(Number(producto.precio) || 0))}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {products.length === 0 && (
                <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-6 text-center text-sm text-orange-700">
                  Todavia no hay productos disponibles en esta carta.
                </div>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-orange-200 bg-white/90 p-4 shadow-[0_10px_34px_-20px_rgba(249,115,22,0.45)] sm:sticky sm:top-4 sm:p-5">
            <div className="mb-4 space-y-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-700">
                <Sparkles className="h-3.5 w-3.5" />
                Registro rapido
              </p>
              <h2 className="text-lg font-black text-gray-900">Registrate para atencion mas agil</h2>
              <p className="text-xs text-gray-600">
                Con tus datos cargados, en caja te encuentran al instante por nombre, telefono o CI.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-2.5">
              <input
                className={inputClass}
                placeholder="Nombre y apellido"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  className={inputClass}
                  placeholder="Telefono"
                  value={form.telefono}
                  onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                />
                <input
                  className={inputClass}
                  placeholder="CI"
                  value={form.ci}
                  onChange={(e) => setForm((p) => ({ ...p, ci: e.target.value }))}
                />
              </div>
              <input
                className={inputClass}
                placeholder="RUC"
                value={form.ruc}
                onChange={(e) => setForm((p) => ({ ...p, ruc: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Direccion"
                value={form.direccion}
                onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
              />
              <p className="mb-1 text-xs font-medium text-gray-600">
                Fecha de nacimiento (para tu cumple)
              </p>
              <input
                className={inputClass}
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => setForm((p) => ({ ...p, fecha_nacimiento: e.target.value }))}
              />

              {registerError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{registerError}</p>
              )}
              {registerOk && (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{registerOk}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Guardar mis datos'
                )}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  )
}


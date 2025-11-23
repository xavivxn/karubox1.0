'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link";
import { Moon, Sun, ShoppingCart, BarChart3, LogOut, Loader2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

export default function Home() {
  const router = useRouter()
  const { tenant, usuario, darkMode, toggleDarkMode, signOut, loading, user } = useTenant();

  // Redirigir a login si no hay sesión después de cargar
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="text-center text-white">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, no renderizar nada (el useEffect redirigirá)
  if (!user) {
    return null
  }

  return (
    <main className={`min-h-screen transition-colors ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-orange-50 via-white to-orange-50'
    }`}>
      {/* Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-orange-500/10 to-transparent" />
        
        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Logo y Info del Tenant */}
            <div className="flex items-center gap-4">
              <div className={`text-5xl ${darkMode ? 'drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]' : ''}`}>
                🍔
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {tenant?.nombre || 'POS Lomitería'}
                </h1>
                {usuario && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {usuario.nombre} • {usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
                  </p>
                )}
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className={`p-3 rounded-xl shadow-lg transition-all hover:scale-110 ${
                  darkMode 
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {usuario && (
                <button
                  onClick={signOut}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg transition-all hover:scale-105 ${
                    darkMode 
                      ? 'bg-red-900/50 text-red-200 hover:bg-red-900/70' 
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <LogOut size={20} />
                  <span className="font-medium">Salir</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="relative z-10 container mx-auto px-6 pb-20">
        {/* Título y Descripción */}
        <div className="text-center mb-16 mt-8">
          <h2 className={`text-5xl md:text-6xl font-bold mb-6 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Sistema de Gestión
          </h2>
          <p className={`text-xl max-w-2xl mx-auto leading-relaxed ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Control total de tu lomitería: ventas, pedidos y reportes en tiempo real
          </p>
        </div>

        {/* Tarjetas de Módulos */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* POS */}
          <Link
            href="/pos"
            className={`group relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-orange-500/20 ${
              darkMode 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-white to-orange-50'
            }`}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative p-8">
              <div className={`inline-flex p-4 rounded-2xl mb-6 ${
                darkMode ? 'bg-orange-500/20' : 'bg-orange-100'
              }`}>
                <ShoppingCart className={`w-8 h-8 ${
                  darkMode ? 'text-orange-400' : 'text-orange-600'
                }`} />
              </div>

              <h3 className={`text-3xl font-bold mb-3 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Punto de Venta
              </h3>

              <p className={`text-lg mb-6 leading-relaxed ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Toma pedidos de forma rápida, gestiona clientes y acumula puntos de fidelidad
              </p>

              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  darkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  Ingresar al POS
                </span>
                <svg 
                  className={`w-5 h-5 transition-transform group-hover:translate-x-2 ${
                    darkMode ? 'text-orange-400' : 'text-orange-600'
                  }`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 h-2 ${
              darkMode ? 'bg-orange-500/50' : 'bg-orange-500'
            }`} />
          </Link>

          {/* Admin */}
          <Link
            href="/admin"
            className={`group relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20 ${
              darkMode 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-white to-blue-50'
            }`}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative p-8">
              <div className={`inline-flex p-4 rounded-2xl mb-6 ${
                darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <BarChart3 className={`w-8 h-8 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>

              <h3 className={`text-3xl font-bold mb-3 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Administración
              </h3>

              <p className={`text-lg mb-6 leading-relaxed ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Panel de control, reportes de ventas, gestión de productos y estadísticas
              </p>

              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  Ver panel admin
                </span>
                <svg 
                  className={`w-5 h-5 transition-transform group-hover:translate-x-2 ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 h-2 ${
              darkMode ? 'bg-blue-500/50' : 'bg-blue-500'
            }`} />
          </Link>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-20">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-2xl ${
            darkMode ? 'bg-gray-800/50' : 'bg-white/50'
          } backdrop-blur-sm`}>
            <div className="text-center">
              <div className={`text-3xl mb-3 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>⚡</div>
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Rápido y Eficiente
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Toma pedidos en segundos
              </p>
            </div>

            <div className="text-center">
              <div className={`text-3xl mb-3 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>⭐</div>
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Puntos de Fidelidad
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Premia a tus clientes frecuentes
              </p>
            </div>

            <div className="text-center">
              <div className={`text-3xl mb-3 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>📊</div>
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Reportes Detallados
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Analiza tus ventas en tiempo real
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-16 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <p>Powered by Next.js 15 • TypeScript • Supabase</p>
        </div>
      </div>
    </main>
  );
}

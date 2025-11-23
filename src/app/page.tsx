'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Cargar preferencia guardada
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
  }, []);

  useEffect(() => {
    // Guardar preferencia
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center p-24 transition-colors ${
      darkMode 
        ? 'bg-gradient-to-b from-gray-900 to-gray-800' 
        : 'bg-gradient-to-b from-gray-50 to-gray-100'
    }`}>
      {/* Botón de modo nocturno */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-8 right-8 p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
          darkMode 
            ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className="text-center space-y-8 max-w-6xl mx-auto">
        <h1 className={`text-6xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          🍔 POS Lomitería
        </h1>
        <p className={`text-xl mx-auto max-w-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Sistema integral de punto de venta con gestión de pedidos en tiempo real
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link
            href="/pos"
            className={`group p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-750' 
                : 'bg-white'
            }`}
          >
            <div className="text-4xl mb-4">🖥️</div>
            <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              POS
            </h2>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Punto de venta para toma de pedidos
            </p>
          </Link>

          <Link
            href="/kds"
            className={`group p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-750' 
                : 'bg-white'
            }`}
          >
            <div className="text-4xl mb-4">🍳</div>
            <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Cocina (KDS)
            </h2>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Pantalla de pedidos para cocina
            </p>
          </Link>

          <Link
            href="/admin"
            className={`group p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-750' 
                : 'bg-white'
            }`}
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Admin
            </h2>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Panel de administración y reportes
            </p>
          </Link>
        </div>

        <div className={`mt-12 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Next.js 14 + TypeScript + Tailwind CSS + Supabase
        </div>
      </div>
    </main>
  );
}


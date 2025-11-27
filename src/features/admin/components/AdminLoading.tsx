/**
 * Admin Module - Loading Component
 * Estado de carga del dashboard
 */

import { Loader2 } from 'lucide-react'

interface AdminLoadingProps {
  darkMode?: boolean
}

export const AdminLoading = ({ darkMode }: AdminLoadingProps) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
        <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
          Preparando tu panel inteligente...
        </p>
      </div>
    </div>
  )
}

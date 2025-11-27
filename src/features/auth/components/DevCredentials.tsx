import { DEV_CREDENTIALS } from '../constants/auth.constants'

export function DevCredentials() {
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs font-semibold text-gray-700 mb-2">
        🧪 Datos de prueba:
      </p>
      <p className="text-xs text-gray-600">
        Email: <code className="bg-gray-200 px-1 rounded">{DEV_CREDENTIALS.email}</code>
      </p>
      <p className="text-xs text-gray-600">
        Pass: <code className="bg-gray-200 px-1 rounded">{DEV_CREDENTIALS.password}</code>
      </p>
    </div>
  )
}

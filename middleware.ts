/**
 * Middleware de Next.js
 * Importa y ejecuta el middleware de autenticación centralizado
 */

import type { NextRequest } from 'next/server'
import { authMiddleware, middlewareConfig } from './src/middleware'

export async function middleware(req: NextRequest) {
  return authMiddleware(req)
}

export const config = middlewareConfig


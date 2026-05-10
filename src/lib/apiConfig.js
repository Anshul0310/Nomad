/**
 * API Configuration
 * 
 * In development: uses localhost:8000
 * In production (Vercel): uses relative /api paths → hits Vercel serverless functions
 * If no backend is available, features degrade gracefully.
 */
const isDev = typeof window !== "undefined" && window.location.hostname === "localhost"
export const API_BASE = import.meta.env.VITE_API_BASE || (isDev ? "http://localhost:8000/api" : "/api")

/**
 * Safe fetch wrapper — returns null instead of throwing when backend is unavailable
 */
export async function apiFetch(path, options = {}) {
  try {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(options.timeout || 10000),
      ...options,
    })
    if (!res.ok && !options.allowError) return null
    return await res.json()
  } catch {
    return null // Backend offline → silently fall back
  }
}

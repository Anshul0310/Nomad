/**
 * API Configuration
 * 
 * In development: uses localhost:8000
 * In production (Vercel): set VITE_API_BASE env var to your deployed backend URL
 * If no backend is available, features degrade gracefully.
 */
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api"

/**
 * Safe fetch wrapper — returns null instead of throwing when backend is unavailable
 */
export async function apiFetch(path, options = {}) {
  try {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(options.timeout || 5000),
      ...options,
    })
    if (!res.ok && !options.allowError) return null
    return await res.json()
  } catch {
    return null // Backend offline → silently fall back
  }
}

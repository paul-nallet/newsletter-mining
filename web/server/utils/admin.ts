import type { H3Event } from 'h3'
import { createError } from 'h3'
import { requireAuth } from './requireAuth'

function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase()
}

export function getAdminEmail(): string {
  return normalizeEmail(process.env.ADMIN_EMAIL || process.env.NUXT_ADMIN_EMAIL || '')
}

export function isAdminEmail(email?: string | null): boolean {
  const adminEmail = getAdminEmail()
  if (!adminEmail) return false
  return normalizeEmail(email) === adminEmail
}

export async function requireAdmin(event: H3Event) {
  const authData = await requireAuth(event)

  if (!isAdminEmail(authData.user.email)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  return authData
}

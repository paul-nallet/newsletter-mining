import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { useDB } from '../database'
import { userProfiles } from '../database/schema'

const DEFAULT_INGEST_DOMAIN = 'ingest.scopesight.app'
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i

function resolveIngestDomain(): string {
  const value = process.env.NUXT_INGEST_EMAIL_DOMAIN || process.env.INGEST_EMAIL_DOMAIN || DEFAULT_INGEST_DOMAIN
  return value.trim().toLowerCase() || DEFAULT_INGEST_DOMAIN
}

export function extractEmailAddress(input: string): string {
  const raw = (input || '').trim()
  if (!raw) return ''

  const candidates = raw
    .split(',')
    .flatMap(chunk => chunk.split(';'))
    .map(chunk => chunk.trim())
    .filter(Boolean)

  for (const candidate of candidates) {
    const angleMatch = candidate.match(/<([^>]+)>/)
    const source = angleMatch?.[1] || candidate
    const matched = source.match(EMAIL_REGEX)?.[0]
    if (matched) return matched.toLowerCase()
  }

  return ''
}

export function normalizeEmailAddress(input: string): string {
  return extractEmailAddress(input)
}

export function generateIngestEmail(): string {
  const id = crypto.randomBytes(4).toString('hex') // 8 hex chars
  return `nl-${id}@${resolveIngestDomain()}`
}

export async function getUserByIngestEmail(email: string): Promise<string | null> {
  const normalizedEmail = normalizeEmailAddress(email)
  if (!normalizedEmail) return null

  const db = useDB()
  const [row] = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.ingestEmail, normalizedEmail))
  return row?.userId ?? null
}

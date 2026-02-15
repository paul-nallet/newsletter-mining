import crypto from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters } from '../../database/schema'
import { CreditExhaustedError } from '../../services/credits'
import { htmlToMarkdown } from '../../services/parser'
import { analyzeNewsletterById } from '../../utils/analyze'
import { getUserByIngestEmail, normalizeEmailAddress } from '../../utils/ingestEmail'

const WEBHOOK_DEDUPE_TTL_MS = 2 * 60 * 60 * 1000
const MESSAGE_DEDUPE_TTL_MS = 24 * 60 * 60 * 1000
const CONTENT_DEDUPE_WINDOW_MS = 30 * 60 * 1000
const dedupeCache = new Map<string, number>()

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const contentType = getHeader(event, 'content-type') || ''
  const maxAgeSeconds = parsePositiveInteger(config.mailgunWebhookMaxAgeSeconds, 900)
  const fields = await readMailgunFields(event, contentType)

  if (contentType.includes('multipart/form-data')) {
    console.info('[mailgun] inbound multipart webhook received')
  }

  // 1. Verify Mailgun signature
  const timestamp = getField(fields, ['timestamp'])
  const token = getField(fields, ['token'])
  const signature = getField(fields, ['signature'])
  const webhookEventKey = `${timestamp}:${token}:${signature}`

  if (!verifyMailgunSignature(config.mailgunWebhookSigningKey, timestamp, token, signature, maxAgeSeconds)) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid signature' })
  }

  if (rememberDuplicate(`event:${webhookEventKey}`, WEBHOOK_DEDUPE_TTL_MS)) {
    console.info('[mailgun] duplicate webhook ignored (same token/signature)')
    return { status: 'duplicate' }
  }

  // 2. Lookup user by recipient ingest email
  const recipient = normalizeEmailAddress(getField(fields, ['recipient', 'to', 'To', 'Delivered-To', 'delivered-to']))

  if (!recipient) {
    throw createError({ statusCode: 400, statusMessage: 'Missing recipient' })
  }

  const userId = await getUserByIngestEmail(recipient)

  if (!userId) {
    console.warn(`[mailgun] no user found for recipient: ${recipient}`)
    // Return 200 to prevent noisy retries when address is unknown.
    return { status: 'ignored', reason: 'unknown_recipient' }
  }

  // 3. Extract email fields
  const sender = getField(fields, ['sender', 'from', 'From'])
  const fromName = extractFromName(sender)
  const fromEmail = normalizeEmailAddress(extractFromEmail(sender))
  const subject = getField(fields, ['subject', 'Subject'])
  const bodyHtml = getField(fields, ['body-html'])
  const bodyPlain = getField(fields, ['body-plain'])
  const strippedText = getField(fields, ['stripped-text', 'stripped-signature', 'body-plain'])
  const messageId = normalizeMessageId(getField(fields, ['Message-Id', 'message-id', 'Message-ID']))

  if (messageId && rememberDuplicate(`message:${userId}:${messageId}`, MESSAGE_DEDUPE_TTL_MS)) {
    console.info(`[mailgun] duplicate message-id ignored: ${messageId}`)
    return { status: 'duplicate' }
  }

  // Prefer HTML -> markdown conversion for richer structure, then text fallback
  let markdownBody = bodyHtml ? htmlToMarkdown(bodyHtml) : ''
  if (!markdownBody) {
    markdownBody = strippedText || bodyPlain
  }

  if (!markdownBody) {
    throw createError({ statusCode: 400, statusMessage: 'No email body found' })
  }

  const db = useDB()
  const duplicateSince = new Date(Date.now() - CONTENT_DEDUPE_WINDOW_MS)
  const [existing] = await db
    .select({ id: newsletters.id })
    .from(newsletters)
    .where(and(
      eq(newsletters.userId, userId),
      eq(newsletters.sourceType, 'mailgun'),
      eq(newsletters.fromEmail, fromEmail),
      eq(newsletters.subject, subject),
      eq(newsletters.markdownBody, markdownBody),
      gt(newsletters.receivedAt, duplicateSince),
    ))
    .limit(1)

  if (existing) {
    console.info(`[mailgun] duplicate content ignored for user ${userId} (newsletter=${existing.id})`)
    return { id: existing.id, status: 'duplicate' }
  }

  // 4. Store in database
  const [row] = await db.insert(newsletters).values({
    userId,
    subject,
    fromEmail,
    fromName,
    markdownBody,
    sourceType: 'mailgun',
  }).returning()

  // 5. Auto-trigger analysis (fire and forget)
  analyzeNewsletterById(row.id, { source: 'mailgun', userId }).catch((err) => {
    if (err instanceof CreditExhaustedError) {
      console.info(
        `Auto-analysis deferred for newsletter ${row.id}: monthly credits exhausted (remaining ${err.status.remaining}).`,
      )
      return
    }
    console.error(`Auto-analysis failed for newsletter ${row.id}:`, err)
  })

  // 6. Return 200 immediately (Mailgun expects quick response)
  return { id: row.id, status: 'received' }
})

function verifyMailgunSignature(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string,
  maxAgeSeconds: number,
): boolean {
  if (!signingKey || !timestamp || !token || !signature) return false

  const parsedTimestamp = Number(timestamp)
  if (!Number.isFinite(parsedTimestamp)) return false
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - parsedTimestamp) > maxAgeSeconds) {
    console.warn('[mailgun] webhook rejected: stale timestamp')
    return false
  }

  const expectedDigest = crypto
    .createHmac('sha256', signingKey)
    .update(timestamp + token)
    .digest()

  const normalizedSignature = signature.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(normalizedSignature)) return false
  const providedDigest = Buffer.from(normalizedSignature, 'hex')

  return crypto.timingSafeEqual(expectedDigest, providedDigest)
}

function getField(fields: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = fields[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

async function readMailgunFields(
  event: any,
  contentType: string,
): Promise<Record<string, string>> {
  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    const fields: Record<string, string> = {}
    if (!parts) return fields

    for (const part of parts) {
      if (part.name && !part.filename) {
        fields[part.name] = part.data.toString('utf-8')
      }
    }
    return fields
  }

  const raw = await readBody<Record<string, unknown>>(event)
  const fields: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw || {})) {
    if (typeof value === 'string') {
      fields[key] = value
    }
    else if (typeof value === 'number' || typeof value === 'boolean') {
      fields[key] = String(value)
    }
  }

  return fields
}

function normalizeMessageId(value: string): string {
  const trimmed = (value || '').trim()
  if (!trimmed) return ''
  return trimmed.replace(/^<|>$/g, '').toLowerCase()
}

function rememberDuplicate(key: string, ttlMs: number): boolean {
  pruneDedupeCache()
  const now = Date.now()
  const expiresAt = dedupeCache.get(key)
  if (expiresAt && expiresAt > now) {
    return true
  }
  dedupeCache.set(key, now + ttlMs)
  return false
}

function pruneDedupeCache() {
  const now = Date.now()
  if (dedupeCache.size < 1024) return
  for (const [key, expiresAt] of dedupeCache.entries()) {
    if (expiresAt <= now) dedupeCache.delete(key)
  }
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

function extractFromName(from: string): string {
  // "John Doe <john@example.com>" -> "John Doe"
  const match = from.match(/^(.+?)\s*</)
  return match ? match[1].trim() : from
}

function extractFromEmail(from: string): string {
  // "John Doe <john@example.com>" -> "john@example.com"
  const match = from.match(/<(.+?)>/)
  return match ? match[1] : from
}

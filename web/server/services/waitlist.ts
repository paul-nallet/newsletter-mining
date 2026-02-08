import crypto from 'node:crypto'
import type { H3Event } from 'h3'

type ChallengeValidationResult =
  | { ok: true; issuedAt: number }
  | { ok: false; reason: string }

const MIN_HUMAN_DELAY_MS = 2500
const MAX_TOKEN_AGE_MS = 1000 * 60 * 30
const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 10
const RATE_LIMIT_MAX_REQUESTS = 8

const ipAttemptWindow = new Map<string, { count: number; windowStart: number }>()

export function createWaitlistChallenge(event: H3Event, secret: string) {
  const issuedAt = Date.now()
  const signature = signChallenge(getFingerprint(event), issuedAt, secret)
  return {
    token: `${issuedAt}.${signature}`,
    minDelayMs: MIN_HUMAN_DELAY_MS,
    expiresInMs: MAX_TOKEN_AGE_MS,
  }
}

export function validateWaitlistChallenge(event: H3Event, token: string, secret: string): ChallengeValidationResult {
  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'Missing anti-bot challenge.' }
  }

  const [issuedAtRaw, providedSignature] = token.split('.')
  const issuedAt = Number.parseInt(issuedAtRaw || '', 10)

  if (!Number.isFinite(issuedAt) || !providedSignature) {
    return { ok: false, reason: 'Malformed anti-bot challenge.' }
  }

  const now = Date.now()
  const ageMs = now - issuedAt

  if (ageMs < MIN_HUMAN_DELAY_MS) {
    return { ok: false, reason: 'Form submitted too quickly.' }
  }

  if (ageMs > MAX_TOKEN_AGE_MS) {
    return { ok: false, reason: 'Anti-bot challenge expired. Please try again.' }
  }

  const expectedSignature = signChallenge(getFingerprint(event), issuedAt, secret)
  const expectedBuffer = Buffer.from(expectedSignature)
  const providedBuffer = Buffer.from(providedSignature)

  if (
    expectedBuffer.length !== providedBuffer.length
    || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return { ok: false, reason: 'Invalid anti-bot challenge.' }
  }

  return { ok: true, issuedAt }
}

export function enforceWaitlistRateLimit(event: H3Event) {
  const ip = getClientIp(event)
  const now = Date.now()
  const current = ipAttemptWindow.get(ip)

  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipAttemptWindow.set(ip, { count: 1, windowStart: now })
    return
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many submissions. Please try again in a few minutes.',
    })
  }

  current.count += 1
  ipAttemptWindow.set(ip, current)
}

export function getWaitlistClientContext(event: H3Event) {
  const ip = getClientIp(event)
  const userAgent = (getHeader(event, 'user-agent') || '').slice(0, 512)
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex')

  return {
    ip,
    ipHash,
    userAgent,
  }
}

export function getWaitlistSecret() {
  const config = useRuntimeConfig()

  return (
    config.betterAuthSecret
    || config.mailgunWebhookSigningKey
    || config.openaiApiKey
    || 'newsletter-mining-dev-waitlist-secret'
  )
}

function getClientIp(event: H3Event) {
  const xForwardedFor = getHeader(event, 'x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]!.trim()
  }

  const xRealIp = getHeader(event, 'x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }

  return event.node.req.socket.remoteAddress || 'unknown'
}

function getFingerprint(event: H3Event) {
  return getClientIp(event)
}

function signChallenge(fingerprint: string, issuedAt: number, secret: string) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${issuedAt}:${fingerprint}`)
    .digest('base64url')
}

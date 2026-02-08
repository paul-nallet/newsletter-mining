import { z } from 'zod'
import { useDB } from '../../database'
import { waitlistSignups } from '../../database/schema'
import {
  enforceWaitlistRateLimit,
  getWaitlistClientContext,
  getWaitlistSecret,
  validateWaitlistChallenge,
} from '../../services/waitlist'

const waitlistBodySchema = z.object({
  email: z.string().trim().email().max(320),
  challengeToken: z.string().min(10),
  company: z.string().max(200).optional().default(''),
  source: z.string().trim().min(1).max(120).optional().default('landing'),
})

export default defineEventHandler(async (event) => {
  enforceWaitlistRateLimit(event)

  const parsed = waitlistBodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid waitlist payload.' })
  }

  const payload = parsed.data

  // Honeypot: bots usually fill hidden inputs.
  if (payload.company.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Suspicious submission blocked.' })
  }

  const secret = getWaitlistSecret()
  const challengeValidation = validateWaitlistChallenge(event, payload.challengeToken, secret)
  if (!challengeValidation.ok) {
    throw createError({ statusCode: 400, statusMessage: challengeValidation.reason })
  }

  const db = useDB()
  const { ipHash, userAgent } = getWaitlistClientContext(event)
  const normalizedEmail = payload.email.toLowerCase()

  try {
    const [row] = await db.insert(waitlistSignups).values({
      email: normalizedEmail,
      source: payload.source,
      ipHash,
      userAgent,
      metadata: {
        challengeIssuedAt: challengeValidation.issuedAt,
      },
    }).returning({ id: waitlistSignups.id })

    console.info(`[waitlist] added ${normalizedEmail} (${payload.source})`)

    return {
      success: true,
      status: 'added',
      id: row?.id,
    }
  }
  catch (error: any) {
    if (error?.code === '23505') {
      return {
        success: true,
        status: 'already_joined',
      }
    }

    console.error('[waitlist] failed to store submission:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to save waitlist signup right now.',
    })
  }
})

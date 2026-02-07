import crypto from 'node:crypto'
import { useDB } from '../../database'
import { newsletters } from '../../database/schema'
import { parseHtml } from '../../services/parser'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const contentType = getHeader(event, 'content-type') || ''

  let fields: Record<string, string> = {}

  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    if (parts) {
      for (const part of parts) {
        if (part.name && !part.filename) {
          fields[part.name] = part.data.toString('utf-8')
        }
      }
    }
  }
  else {
    fields = await readBody(event)
  }

  // 1. Verify Mailgun signature
  const timestamp = fields['timestamp']
  const token = fields['token']
  const signature = fields['signature']

  if (!verifyMailgunSignature(config.mailgunWebhookSigningKey, timestamp, token, signature)) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid signature' })
  }

  // 2. Extract email fields
  const sender = fields['sender'] || fields['from'] || ''
  const fromName = extractFromName(sender)
  const fromEmail = extractFromEmail(sender)
  const subject = fields['subject'] || ''
  const bodyHtml = fields['body-html'] || ''
  const bodyPlain = fields['body-plain'] || ''
  const strippedText = fields['stripped-text'] || ''

  // Prefer stripped-text (no quoted reply), fall back to body-plain, then parsed HTML
  let textBody = strippedText || bodyPlain
  if (!textBody && bodyHtml) {
    textBody = parseHtml(bodyHtml)
  }

  if (!textBody) {
    throw createError({ statusCode: 400, statusMessage: 'No email body found' })
  }

  // 3. Store in database
  const db = useDB()
  const [row] = await db.insert(newsletters).values({
    subject,
    fromEmail,
    fromName,
    htmlBody: bodyHtml,
    textBody,
    sourceType: 'mailgun',
  }).returning()

  // 4. Auto-trigger analysis (fire and forget)
  $fetch(`/api/newsletters/${row.id}/analyze`, { method: 'POST' }).catch((err) => {
    console.error(`Auto-analysis failed for newsletter ${row.id}:`, err)
  })

  // 5. Return 200 immediately (Mailgun expects quick response)
  return { id: row.id, status: 'received' }
})

function verifyMailgunSignature(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string,
): boolean {
  if (!signingKey || !timestamp || !token || !signature) return false
  const hmac = crypto
    .createHmac('sha256', signingKey)
    .update(timestamp + token)
    .digest('hex')
  return hmac === signature
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

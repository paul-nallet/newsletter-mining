import { useDB } from '../../database'
import { newsletters } from '../../database/schema'
import { extractSubjectFromHtml, htmlToMarkdown } from '../../services/parser'
import { emitAppEvent } from '../../utils/eventBus'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const db = useDB()
  const contentType = getHeader(event, 'content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await readMultipartFormData(event)
    const filePart = formData?.find(p => p.name === 'file')
    if (!filePart) {
      throw createError({ statusCode: 400, statusMessage: 'No file provided' })
    }

    const raw = filePart.data.toString('utf-8')
    const filename = filePart.filename || 'upload'
    const ext = filename.split('.').pop()?.toLowerCase() || 'txt'

    let markdownBody = raw
    let subject = ''

    if (ext === 'html' || ext === 'htm') {
      subject = extractSubjectFromHtml(raw)
      markdownBody = htmlToMarkdown(raw)
    }

    const [row] = await db.insert(newsletters).values({
      userId,
      subject,
      markdownBody,
      sourceType: 'file',
    }).returning()

    emitAppEvent('newsletter:uploaded', { id: row!.id, subject: row!.subject || '' })

    return row
  }

  // JSON body
  const body = await readBody(event)
  if (!body?.markdownBody) {
    throw createError({ statusCode: 400, statusMessage: 'markdownBody is required' })
  }

  const [row] = await db.insert(newsletters).values({
    userId,
    subject: body.subject || '',
    fromEmail: body.fromEmail || '',
    fromName: body.fromName || '',
    markdownBody: body.markdownBody,
    sourceType: 'file',
  }).returning()

  emitAppEvent('newsletter:uploaded', { id: row!.id, subject: row!.subject || '' })

  return row
})

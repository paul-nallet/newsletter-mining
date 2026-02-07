import { useDB } from '../../database'
import { newsletters } from '../../database/schema'
import { parseHtml, extractSubjectFromHtml } from '../../services/parser'

export default defineEventHandler(async (event) => {
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

    let textBody = raw
    let htmlBody = ''
    let subject = ''

    if (ext === 'html' || ext === 'htm') {
      htmlBody = raw
      subject = extractSubjectFromHtml(raw)
      textBody = parseHtml(raw)
    }

    const [row] = await db.insert(newsletters).values({
      subject,
      htmlBody,
      textBody,
      sourceType: 'file',
    }).returning()

    return row
  }

  // JSON body
  const body = await readBody(event)
  if (!body?.textBody) {
    throw createError({ statusCode: 400, statusMessage: 'textBody is required' })
  }

  const [row] = await db.insert(newsletters).values({
    subject: body.subject || '',
    fromEmail: body.fromEmail || '',
    fromName: body.fromName || '',
    htmlBody: body.htmlBody || '',
    textBody: body.textBody,
    sourceType: 'file',
  }).returning()

  return row
})

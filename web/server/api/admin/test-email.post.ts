import { requireAdmin } from '../../utils/admin'
import { wrapEmailHtml } from '../../utils/mail'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)
  const body = await readBody<{ to?: string }>(event)
  const to = body?.to?.trim() || user.email

  const { sendMail } = useNodeMailer()

  const html = wrapEmailHtml(`
    <p style="margin:0 0 16px">This is a test email from <strong>ScopeSight</strong>.</p>
    <p style="margin:0 0 16px">If you're reading this, your email configuration is working correctly.</p>
    <p style="margin:0;color:#71717a;font-size:13px">Sent by admin ${user.email} at ${new Date().toISOString()}</p>
  `, { preheader: 'ScopeSight email configuration test' })

  await sendMail({
    to,
    subject: 'ScopeSight — Test email',
    html,
    text: `This is a test email from ScopeSight.\n\nIf you're reading this, your email configuration is working correctly.\n\nSent by admin ${user.email} at ${new Date().toISOString()}`,
  })

  console.info(`[admin] test email sent to ${to} by ${user.email}`)

  return { ok: true, to }
})

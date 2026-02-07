import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters, problems } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDB()

  const [newsletter] = await db
    .select()
    .from(newsletters)
    .where(eq(newsletters.id, id))

  if (!newsletter) {
    throw createError({ statusCode: 404, statusMessage: 'Newsletter not found' })
  }

  const newsletterProblems = await db
    .select({
      id: problems.id,
      problemSummary: problems.problemSummary,
      problemDetail: problems.problemDetail,
      category: problems.category,
      severity: problems.severity,
      originalQuote: problems.originalQuote,
      context: problems.context,
      signals: problems.signals,
      mentionedTools: problems.mentionedTools,
      targetAudience: problems.targetAudience,
      createdAt: problems.createdAt,
    })
    .from(problems)
    .where(eq(problems.newsletterId, id))

  return { ...newsletter, problems: newsletterProblems }
})

import { desc, eq, and, sql, count } from 'drizzle-orm'
import { useDB } from '../../database'
import { problems, newsletters } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  const { severity, category, search, limit = '50', offset = '0' } = query

  const conditions = []

  if (severity && typeof severity === 'string') {
    conditions.push(eq(problems.severity, severity as any))
  }
  if (category && typeof category === 'string') {
    conditions.push(eq(problems.category, category as any))
  }
  if (search && typeof search === 'string') {
    conditions.push(
      sql`(${problems.problemSummary} ILIKE ${'%' + search + '%'}
        OR ${problems.problemDetail} ILIKE ${'%' + search + '%'})`,
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select({
      id: problems.id,
      newsletterId: problems.newsletterId,
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
      newsletterSubject: newsletters.subject,
    })
    .from(problems)
    .leftJoin(newsletters, eq(problems.newsletterId, newsletters.id))
    .where(where)
    .orderBy(desc(problems.createdAt))
    .limit(Number(limit))
    .offset(Number(offset))

  return rows
})

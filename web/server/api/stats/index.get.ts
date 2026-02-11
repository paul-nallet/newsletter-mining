import { and, count, sql, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters, problems, problemClusters } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const db = useDB()

  const userFilter = and(eq(newsletters.userId, userId), isNull(newsletters.deletedAt))!
  const problemUserFilter = eq(problems.userId, userId)
  const clusterUserFilter = eq(problemClusters.userId, userId)

  const [newsletterCount] = await db.select({ count: count() }).from(newsletters).where(userFilter)
  const [problemCount] = await db.select({ count: count() }).from(problems).where(problemUserFilter)
  const [clusterCount] = await db.select({ count: count() }).from(problemClusters).where(clusterUserFilter)

  const severityBreakdown = await db
    .select({ severity: problems.severity, count: count() })
    .from(problems)
    .where(problemUserFilter)
    .groupBy(problems.severity)

  const categoryBreakdown = await db
    .select({ category: problems.category, count: count() })
    .from(problems)
    .where(problemUserFilter)
    .groupBy(problems.category)
    .orderBy(sql`count(*) DESC`)
    .limit(10)

  const recentAnalyses = await db
    .select({
      id: newsletters.id,
      subject: newsletters.subject,
      fromName: newsletters.fromName,
      analyzedAt: newsletters.analyzedAt,
    })
    .from(newsletters)
    .where(and(userFilter, isNotNull(newsletters.analyzedAt)))
    .orderBy(desc(newsletters.analyzedAt))
    .limit(5)

  return {
    totalNewsletters: newsletterCount.count,
    totalProblems: problemCount.count,
    totalClusters: clusterCount.count,
    severityBreakdown: Object.fromEntries(
      severityBreakdown.map(r => [r.severity, r.count]),
    ),
    categoryBreakdown,
    recentAnalyses,
  }
})

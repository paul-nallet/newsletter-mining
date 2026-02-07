import { count, sql, desc, isNotNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters, problems, problemClusters } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const [newsletterCount] = await db.select({ count: count() }).from(newsletters)
  const [problemCount] = await db.select({ count: count() }).from(problems)
  const [clusterCount] = await db.select({ count: count() }).from(problemClusters)

  const severityBreakdown = await db
    .select({ severity: problems.severity, count: count() })
    .from(problems)
    .groupBy(problems.severity)

  const categoryBreakdown = await db
    .select({ category: problems.category, count: count() })
    .from(problems)
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
    .where(isNotNull(newsletters.analyzedAt))
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

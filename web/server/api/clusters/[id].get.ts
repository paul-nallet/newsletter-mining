import { eq, inArray } from 'drizzle-orm'
import { useDB } from '../../database'
import { problemClusters, problems, newsletters } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDB()

  const [cluster] = await db
    .select()
    .from(problemClusters)
    .where(eq(problemClusters.id, id))

  if (!cluster) {
    throw createError({ statusCode: 404, statusMessage: 'Cluster not found' })
  }

  // Fetch all problems in this cluster
  const problemIds = cluster.problemIds || []
  let clusterProblems: any[] = []

  if (problemIds.length > 0) {
    clusterProblems = await db
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
        newsletterId: problems.newsletterId,
        newsletterSubject: newsletters.subject,
        newsletterFromName: newsletters.fromName,
      })
      .from(problems)
      .leftJoin(newsletters, eq(problems.newsletterId, newsletters.id))
      .where(inArray(problems.id, problemIds))
  }

  return { ...cluster, problems: clusterProblems }
})

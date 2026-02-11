import { and, eq, isNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters } from '../../database/schema'
import { CreditExhaustedError } from '../../services/credits'
import { analyzeNewsletterById } from '../../utils/analyze'
import { generateClusters, enrichClusterSummaries } from '../../services/clustering'
import { usePgClient } from '../../database/client'

export default defineTask({
  meta: {
    name: 'analyze:pending',
    description: 'Analyze all pending newsletters (per-user)',
  },
  async run() {
    const pgClient = usePgClient()
    const db = useDB()

    // Get all users who have pending newsletters
    const users = await pgClient<{ id: string }[]>`select id from "user"`

    let totalAnalyzed = 0
    let totalFailed = 0
    let totalSkipped = 0

    for (const user of users) {
      const userId = user.id

      const pending = await db
        .select({ id: newsletters.id, subject: newsletters.subject })
        .from(newsletters)
        .where(and(eq(newsletters.userId, userId), eq(newsletters.analyzed, false), isNull(newsletters.deletedAt)))

      if (!pending.length) continue

      console.log(`[analyze:pending] User ${userId}: ${pending.length} unanalyzed newsletter(s)`)

      let analyzed = 0
      let failed = 0
      let skippedDueToCredits = 0

      for (let i = 0; i < pending.length; i++) {
        const newsletter = pending[i]
        try {
          const result = await analyzeNewsletterById(newsletter.id, { source: 'task', userId })
          analyzed++
          console.log(`[analyze:pending] ✓ ${newsletter.subject || newsletter.id} — ${result.problemCount} problem(s)`)
        }
        catch (err) {
          if (err instanceof CreditExhaustedError) {
            skippedDueToCredits = pending.length - i
            console.warn(`[analyze:pending] Credit limit reached for user ${userId}, skipping ${skippedDueToCredits} newsletter(s)`)
            break
          }
          failed++
          console.error(`[analyze:pending] ✗ ${newsletter.subject || newsletter.id}:`, err)
        }
      }

      // Regenerate clusters for this user if any newsletters were analyzed
      if (analyzed > 0) {
        try {
          const clusterResult = await generateClusters(userId)
          await enrichClusterSummaries(userId)
          if (clusterResult) {
            console.log(`[analyze:pending] User ${userId}: clusters regenerated: ${clusterResult.totalClusters} clusters from ${clusterResult.totalProblems} problems`)
          }
        }
        catch (err) {
          console.error(`[analyze:pending] Cluster generation failed for user ${userId}:`, err)
        }
      }

      totalAnalyzed += analyzed
      totalFailed += failed
      totalSkipped += skippedDueToCredits
    }

    console.log(`[analyze:pending] Done: ${totalAnalyzed} analyzed, ${totalFailed} failed, ${totalSkipped} skipped (credits)`)

    return { result: { analyzed: totalAnalyzed, failed: totalFailed, skippedDueToCredits: totalSkipped } }
  },
})

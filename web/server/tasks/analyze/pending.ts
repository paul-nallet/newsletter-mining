import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters } from '../../database/schema'
import { CreditExhaustedError } from '../../services/credits'
import { analyzeNewsletterById } from '../../utils/analyze'
import { generateClusters, enrichClusterSummaries } from '../../services/clustering'

export default defineTask({
  meta: {
    name: 'analyze:pending',
    description: 'Analyze all pending newsletters',
  },
  async run() {
    const db = useDB()

    const pending = await db
      .select({ id: newsletters.id, subject: newsletters.subject })
      .from(newsletters)
      .where(eq(newsletters.analyzed, false))

    console.log(`[analyze:pending] Found ${pending.length} unanalyzed newsletter(s)`)

    let analyzed = 0
    let failed = 0
    let skippedDueToCredits = 0

    for (let i = 0; i < pending.length; i++) {
      const newsletter = pending[i]
      try {
        const result = await analyzeNewsletterById(newsletter.id, { source: 'task' })
        analyzed++
        console.log(`[analyze:pending] ✓ ${newsletter.subject || newsletter.id} — ${result.problemCount} problem(s)`)
      }
      catch (err) {
        if (err instanceof CreditExhaustedError) {
          skippedDueToCredits = pending.length - i
          console.warn(`[analyze:pending] Credit limit reached, skipping ${skippedDueToCredits} newsletter(s)`)
          break
        }
        failed++
        console.error(`[analyze:pending] ✗ ${newsletter.subject || newsletter.id}:`, err)
      }
    }

    console.log(`[analyze:pending] Done: ${analyzed} analyzed, ${failed} failed, ${skippedDueToCredits} skipped (credits)`)

    // Regenerate clusters if any newsletters were analyzed
    if (analyzed > 0) {
      try {
        const clusterResult = await generateClusters()
        await enrichClusterSummaries()
        console.log(`[analyze:pending] Clusters regenerated: ${clusterResult.totalClusters} clusters from ${clusterResult.totalProblems} problems`)
      }
      catch (err) {
        console.error('[analyze:pending] Cluster generation failed:', err)
      }
    }

    return { result: { analyzed, failed, skippedDueToCredits } }
  },
})

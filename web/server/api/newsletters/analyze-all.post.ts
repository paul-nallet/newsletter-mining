import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters } from '../../database/schema'
import { CreditExhaustedError } from '../../services/credits'
import { analyzeNewsletterById } from '../../utils/analyze'
import { generateClusters, enrichClusterSummaries } from '../../services/clustering'
import { emitAppEvent } from '../../utils/eventBus'

export default defineEventHandler(async () => {
  const db = useDB()
  const pending = await db
    .select({ id: newsletters.id })
    .from(newsletters)
    .where(eq(newsletters.analyzed, false))

  if (!pending.length) return { started: false, count: 0 }

  // Fire-and-forget background processing
  analyzeAllBackground(pending.map(n => n.id))

  return { started: true, count: pending.length }
})

async function analyzeAllBackground(ids: string[]) {
  let analyzed = 0
  let failed = 0
  let skippedDueToCredits = 0

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    try {
      await analyzeNewsletterById(id, { source: 'batch' })
      analyzed++
      emitAppEvent('newsletter:analyzed', { id, problemCount: 0 })
    }
    catch (err) {
      if (err instanceof CreditExhaustedError) {
        skippedDueToCredits = ids.length - i
        emitAppEvent('analyze-all:progress', {
          current: analyzed + failed,
          total: ids.length,
          failed,
          skippedDueToCredits,
        })
        break
      }
      console.error(`Failed to analyze newsletter ${id}:`, err)
      failed++
    }
    emitAppEvent('analyze-all:progress', { current: analyzed + failed, total: ids.length, failed, skippedDueToCredits })
  }

  if (analyzed > 0) {
    try {
      const result = await generateClusters()
      await enrichClusterSummaries()
      if (result) {
        emitAppEvent('clusters:updated', { totalClusters: result.totalClusters, totalProblems: result.totalProblems })
      }
    }
    catch (err) {
      console.error('Failed to regenerate clusters after batch analysis:', err)
    }
  }

  emitAppEvent('analyze-all:done', { analyzed, failed, total: ids.length, skippedDueToCredits })
}

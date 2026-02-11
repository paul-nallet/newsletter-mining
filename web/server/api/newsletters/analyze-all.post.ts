import { and, eq, isNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters } from '../../database/schema'
import { CreditExhaustedError } from '../../services/credits'
import { analyzeNewsletterById } from '../../utils/analyze'
import { generateClusters, enrichClusterSummaries } from '../../services/clustering'
import { emitAppEvent } from '../../utils/eventBus'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const db = useDB()
  const pending = await db
    .select({ id: newsletters.id })
    .from(newsletters)
    .where(and(eq(newsletters.userId, userId), eq(newsletters.analyzed, false), isNull(newsletters.deletedAt)))

  if (!pending.length) return { started: false, count: 0 }

  // Fire-and-forget background processing
  analyzeAllBackground(pending.map(n => n.id), userId)

  return { started: true, count: pending.length }
})

async function analyzeAllBackground(ids: string[], userId: string) {
  let analyzed = 0
  let failed = 0
  let skippedDueToCredits = 0

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    try {
      await analyzeNewsletterById(id, { source: 'batch', userId })
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
      const result = await generateClusters(userId)
      await enrichClusterSummaries(userId)
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

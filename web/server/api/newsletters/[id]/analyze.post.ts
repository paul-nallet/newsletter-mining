import { analyzeNewsletterById } from '../../../utils/analyze'
import { generateClusters, enrichClusterSummaries } from '../../../services/clustering'
import { CreditExhaustedError } from '../../../services/credits'
import { emitAppEvent } from '../../../utils/eventBus'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  try {
    const result = await analyzeNewsletterById(id, { source: 'manual', userId })

    emitAppEvent('newsletter:analyzed', { id, problemCount: result.problemCount })

    // Fire-and-forget: cluster regen in background
    regenerateClustersBackground(userId)

    return { newsletterId: id, ...result }
  }
  catch (err: any) {
    if (err instanceof CreditExhaustedError) {
      throw createError({
        statusCode: 402,
        statusMessage: 'Monthly credit limit reached',
        data: {
          code: err.code,
          creditStatus: err.status,
        },
      })
    }
    if (err.message?.includes('not found')) {
      throw createError({ statusCode: 404, statusMessage: err.message })
    }
    throw err
  }
})

function regenerateClustersBackground(userId: string) {
  generateClusters(userId)
    .then((result) => enrichClusterSummaries(userId).then(() => result))
    .then((result) => {
      if (result) {
        emitAppEvent('clusters:updated', { totalClusters: result.totalClusters, totalProblems: result.totalProblems })
      }
    })
    .catch((err) => console.error('Background cluster regeneration failed:', err))
}

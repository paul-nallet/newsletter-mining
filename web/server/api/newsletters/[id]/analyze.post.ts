import { analyzeNewsletterById } from '../../../utils/analyze'
import { generateClusters, enrichClusterSummaries } from '../../../services/clustering'
import { emitAppEvent } from '../../../utils/eventBus'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  try {
    const result = await analyzeNewsletterById(id)

    emitAppEvent('newsletter:analyzed', { id, problemCount: result.problemCount })

    // Fire-and-forget: cluster regen in background
    regenerateClustersBackground()

    return { newsletterId: id, ...result }
  }
  catch (err: any) {
    if (err.message?.includes('not found')) {
      throw createError({ statusCode: 404, statusMessage: err.message })
    }
    throw err
  }
})

function regenerateClustersBackground() {
  generateClusters()
    .then((result) => enrichClusterSummaries().then(() => result))
    .then((result) => {
      if (result) {
        emitAppEvent('clusters:updated', { totalClusters: result.totalClusters, totalProblems: result.totalProblems })
      }
    })
    .catch((err) => console.error('Background cluster regeneration failed:', err))
}

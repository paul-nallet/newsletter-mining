import { generateClusters, enrichClusterSummaries } from '../../services/clustering'
import { emitAppEvent } from '../../utils/eventBus'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  const result = await generateClusters(userId)
  await enrichClusterSummaries(userId)

  if (result) {
    emitAppEvent('clusters:updated', { totalClusters: result.totalClusters, totalProblems: result.totalProblems })
  }

  return { success: true, ...result }
})

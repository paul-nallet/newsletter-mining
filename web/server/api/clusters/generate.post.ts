import { generateClusters, enrichClusterSummaries } from '../../services/clustering'
import { emitAppEvent } from '../../utils/eventBus'

export default defineEventHandler(async () => {
  const result = await generateClusters()
  await enrichClusterSummaries()

  if (result) {
    emitAppEvent('clusters:updated', { totalClusters: result.totalClusters, totalProblems: result.totalProblems })
  }

  return { success: true, ...result }
})

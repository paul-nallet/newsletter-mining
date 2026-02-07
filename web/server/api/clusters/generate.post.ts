import { generateClusters, enrichClusterSummaries } from '../../services/clustering'

export default defineEventHandler(async () => {
  const result = await generateClusters()
  await enrichClusterSummaries()
  return { success: true, ...result }
})

import { desc } from 'drizzle-orm'
import { useDB } from '../../database'
import { problemClusters } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const rows = await db
    .select()
    .from(problemClusters)
    .orderBy(desc(problemClusters.mentionCount))

  return rows
})

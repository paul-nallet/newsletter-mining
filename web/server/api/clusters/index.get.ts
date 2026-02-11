import { desc, eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { problemClusters } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const db = useDB()

  const rows = await db
    .select()
    .from(problemClusters)
    .where(eq(problemClusters.userId, userId))
    .orderBy(desc(problemClusters.mentionCount))

  return rows
})

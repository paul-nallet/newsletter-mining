import { inArray, and, eq, isNull, sql } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const body = await readBody<{ ids?: string[] }>(event)

  if (!Array.isArray(body?.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'ids must be a non-empty array' })
  }

  if (body.ids.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Maximum 100 ids per request' })
  }

  const db = useDB()
  const result = await db
    .update(newsletters)
    .set({ deletedAt: sql`now()` })
    .where(
      and(
        inArray(newsletters.id, body.ids),
        eq(newsletters.userId, userId),
        isNull(newsletters.deletedAt),
      ),
    )
    .returning({ id: newsletters.id })

  return { archived: result.length }
})

import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { userProfiles } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const body = await readBody<{
    clusterThreshold?: number
    clusterMinSize?: number
    autoRecluster?: boolean
  }>(event)

  const updates: Record<string, unknown> = {}

  if (body.clusterThreshold !== undefined) {
    const t = Number(body.clusterThreshold)
    if (!Number.isFinite(t) || t < 0.5 || t > 0.95) {
      throw createError({ statusCode: 400, statusMessage: 'clusterThreshold must be between 0.5 and 0.95' })
    }
    updates.clusterThreshold = Math.round(t * 100) / 100
  }

  if (body.clusterMinSize !== undefined) {
    const m = Math.round(Number(body.clusterMinSize))
    if (!Number.isFinite(m) || m < 1 || m > 100) {
      throw createError({ statusCode: 400, statusMessage: 'clusterMinSize must be between 1 and 100' })
    }
    updates.clusterMinSize = m
  }

  if (body.autoRecluster !== undefined) {
    updates.autoRecluster = Boolean(body.autoRecluster)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' })
  }

  const db = useDB()
  await db
    .update(userProfiles)
    .set(updates)
    .where(eq(userProfiles.userId, userId))

  return { success: true }
})

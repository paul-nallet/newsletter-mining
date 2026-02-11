import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { userProfiles } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const db = useDB()

  const [profile] = await db
    .select({ ingestEmail: userProfiles.ingestEmail })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'User profile not found' })
  }

  return { ingestEmail: profile.ingestEmail }
})

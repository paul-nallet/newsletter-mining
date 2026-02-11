import { eq } from 'drizzle-orm'
import { readBody } from 'h3'
import { useDB } from '../../database'
import {
  newsletters,
  problems,
  problemClusters,
  analysisCreditMonths,
  analysisCreditReservations,
} from '../../database/schema'

const RESET_CONFIRMATION = 'RESET DATABASE'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  const body = await readBody<{ confirmation?: string }>(event)
  if (body?.confirmation !== RESET_CONFIRMATION) {
    throw createError({
      statusCode: 400,
      statusMessage: `Confirmation text must be exactly "${RESET_CONFIRMATION}".`,
    })
  }

  const db = useDB()

  // Delete user's data in correct order (respecting FK constraints)
  await db.delete(analysisCreditReservations).where(eq(analysisCreditReservations.userId, userId))
  await db.delete(analysisCreditMonths).where(eq(analysisCreditMonths.userId, userId))
  await db.delete(problemClusters).where(eq(problemClusters.userId, userId))
  await db.delete(problems).where(eq(problems.userId, userId))
  await db.delete(newsletters).where(eq(newsletters.userId, userId))

  console.info(`[settings] data reset for user ${userId}`)

  return {
    success: true,
  }
})

import { getCreditStatus } from '../../services/credits'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  return getCreditStatus(userId)
})

import { getCreditStatus } from '../../services/credits'

export default defineEventHandler(async () => {
  return getCreditStatus()
})

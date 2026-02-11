import { useDB } from '../database'
import { analysisCreditMonths } from '../database/schema'
import { FREE_CREDIT_LIMIT, PLAN_CREDITS } from './planLimits'

function toPeriodStartUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

export async function syncCreditLimit(userId: string, planName: string | null) {
  const limit = planName ? PLAN_CREDITS[planName] ?? FREE_CREDIT_LIMIT : FREE_CREDIT_LIMIT
  const db = useDB()
  const periodStart = toPeriodStartUTC(new Date())

  await db
    .insert(analysisCreditMonths)
    .values({
      userId,
      periodStart,
      creditLimit: limit,
    })
    .onConflictDoUpdate({
      target: [analysisCreditMonths.userId, analysisCreditMonths.periodStart],
      set: {
        creditLimit: limit,
        updatedAt: new Date(),
      },
    })

  console.info(`[stripe] synced credit limit for user ${userId}: plan=${planName ?? 'free'}, limit=${limit}`)
}

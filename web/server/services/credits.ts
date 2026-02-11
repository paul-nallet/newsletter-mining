import { and, eq, lt, sql } from 'drizzle-orm'
import type { CreditStatus } from '#shared/types/credits'
import { useDB } from '../database'
import { analysisCreditMonths, analysisCreditReservations } from '../database/schema'
import { emitAppEvent } from '../utils/eventBus'
import { FREE_CREDIT_LIMIT, PLAN_CREDITS } from '../utils/planLimits'
import { usePgClient } from '../database/client'

const RESERVATION_TTL_MINUTES = 20

async function getCreditLimitForUser(userId: string): Promise<number> {
  const pgClient = usePgClient()
  const result = await pgClient`
    SELECT plan FROM subscription
    WHERE "referenceId" = ${userId}
      AND status = 'active'
    ORDER BY "periodStart" DESC
    LIMIT 1
  `
  const planName = result[0]?.plan as string | undefined
  if (planName && PLAN_CREDITS[planName]) {
    return PLAN_CREDITS[planName]
  }
  return FREE_CREDIT_LIMIT
}

export type AnalysisCreditSource = 'mailgun' | 'manual' | 'batch' | 'task'

export interface CreditReservation {
  reservationId: string
  status: CreditStatus
}

export class CreditExhaustedError extends Error {
  public readonly code = 'CREDIT_EXHAUSTED'

  constructor(public readonly status: CreditStatus) {
    super('Monthly analysis credit limit reached')
  }
}

function toPeriodStartUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

function normalizePeriodStart(value: string | Date): string {
  if (typeof value === 'string') return value
  return value.toISOString().slice(0, 10)
}

function toCreditStatus(row: {
  periodStart: string | Date
  creditLimit: number
  consumedCount: number
  reservedCount: number
}): CreditStatus {
  const limit = Number(row.creditLimit ?? FREE_CREDIT_LIMIT)
  const consumed = Number(row.consumedCount ?? 0)
  const reserved = Number(row.reservedCount ?? 0)
  const remaining = Math.max(limit - consumed - reserved, 0)

  return {
    limit,
    periodStart: normalizePeriodStart(row.periodStart),
    consumed,
    reserved,
    remaining,
    exhausted: remaining <= 0,
  }
}

async function ensureCurrentPeriodRow(
  tx: any,
  userId: string,
  periodStart: string,
  creditLimit: number,
) {
  await tx
    .insert(analysisCreditMonths)
    .values({
      userId,
      periodStart,
      creditLimit,
    })
    .onConflictDoNothing()
}

async function releaseExpiredReservations(
  tx: any,
  userId: string,
  periodStart: string,
  now: Date,
) {
  const expired = await tx
    .update(analysisCreditReservations)
    .set({
      status: 'released',
      finalizedAt: now,
      failureReason: 'reservation_expired',
    })
    .where(
      and(
        eq(analysisCreditReservations.userId, userId),
        eq(analysisCreditReservations.periodStart, periodStart),
        eq(analysisCreditReservations.status, 'reserved'),
        lt(analysisCreditReservations.expiresAt, now),
      ),
    )
    .returning({ id: analysisCreditReservations.id })

  if (!expired.length) return

  await tx
    .update(analysisCreditMonths)
    .set({
      reservedCount: sql`greatest(${analysisCreditMonths.reservedCount} - ${expired.length}, 0)`,
      updatedAt: now,
    })
    .where(
      and(
        eq(analysisCreditMonths.userId, userId),
        eq(analysisCreditMonths.periodStart, periodStart),
      ),
    )
}

async function getStatusInTransaction(
  tx: any,
  userId: string,
  periodStart: string,
): Promise<CreditStatus> {
  const [row] = await tx
    .select({
      periodStart: analysisCreditMonths.periodStart,
      creditLimit: analysisCreditMonths.creditLimit,
      consumedCount: analysisCreditMonths.consumedCount,
      reservedCount: analysisCreditMonths.reservedCount,
    })
    .from(analysisCreditMonths)
    .where(
      and(
        eq(analysisCreditMonths.userId, userId),
        eq(analysisCreditMonths.periodStart, periodStart),
      ),
    )

  if (!row) {
    return {
      limit: FREE_CREDIT_LIMIT,
      periodStart,
      consumed: 0,
      reserved: 0,
      remaining: FREE_CREDIT_LIMIT,
      exhausted: false,
    }
  }

  return toCreditStatus(row)
}

function emitCreditsUpdated(status: CreditStatus) {
  emitAppEvent('credits:updated', status)
}

export async function getCreditStatus(userId: string, now = new Date()): Promise<CreditStatus> {
  const db = useDB()
  const periodStart = toPeriodStartUTC(now)
  const creditLimit = await getCreditLimitForUser(userId)

  return db.transaction(async (tx) => {
    await ensureCurrentPeriodRow(tx, userId, periodStart, creditLimit)
    await releaseExpiredReservations(tx, userId, periodStart, now)
    return getStatusInTransaction(tx, userId, periodStart)
  })
}

export async function reserveCredit(input: {
  newsletterId: string
  userId: string
  source: AnalysisCreditSource
  now?: Date
}): Promise<CreditReservation> {
  const db = useDB()
  const now = input.now ?? new Date()
  const periodStart = toPeriodStartUTC(now)

  const creditLimit = await getCreditLimitForUser(input.userId)

  const result = await db.transaction(async (tx) => {
    await ensureCurrentPeriodRow(tx, input.userId, periodStart, creditLimit)
    await releaseExpiredReservations(tx, input.userId, periodStart, now)

    const updatedRows = await tx
      .update(analysisCreditMonths)
      .set({
        reservedCount: sql`${analysisCreditMonths.reservedCount} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(analysisCreditMonths.userId, input.userId),
          eq(analysisCreditMonths.periodStart, periodStart),
          sql`${analysisCreditMonths.reservedCount} + ${analysisCreditMonths.consumedCount} < ${analysisCreditMonths.creditLimit}`,
        ),
      )
      .returning({
        periodStart: analysisCreditMonths.periodStart,
        creditLimit: analysisCreditMonths.creditLimit,
        consumedCount: analysisCreditMonths.consumedCount,
        reservedCount: analysisCreditMonths.reservedCount,
      })

    if (!updatedRows.length) {
      const status = await getStatusInTransaction(tx, input.userId, periodStart)
      console.warn(
        `[credits] reserve denied: exhausted for period ${status.periodStart} (consumed=${status.consumed}, reserved=${status.reserved}, limit=${status.limit})`,
      )
      throw new CreditExhaustedError(status)
    }

    const [reservation] = await tx
      .insert(analysisCreditReservations)
      .values({
        userId: input.userId,
        periodStart,
        newsletterId: input.newsletterId,
        source: input.source,
        status: 'reserved',
        expiresAt: addMinutes(now, RESERVATION_TTL_MINUTES),
      })
      .returning({ id: analysisCreditReservations.id })

    return {
      reservationId: reservation.id,
      status: toCreditStatus(updatedRows[0]),
    }
  })

  console.info(
    `[credits] reserve success: reservation=${result.reservationId} period=${result.status.periodStart} remaining=${result.status.remaining}`,
  )
  emitCreditsUpdated(result.status)
  return result
}

async function finalizeReservation(
  reservationId: string,
  mode: 'consumed' | 'released',
  reason?: string,
): Promise<CreditStatus> {
  const db = useDB()
  const now = new Date()
  let changed = false

  const status = await db.transaction(async (tx) => {
    const finalizedRows = await tx
      .update(analysisCreditReservations)
      .set({
        status: mode,
        failureReason: mode === 'released' ? (reason || 'analysis_failed') : null,
        finalizedAt: now,
      })
      .where(
        and(
          eq(analysisCreditReservations.id, reservationId),
          eq(analysisCreditReservations.status, 'reserved'),
        ),
      )
      .returning({
        periodStart: analysisCreditReservations.periodStart,
        userId: analysisCreditReservations.userId,
      })

    if (!finalizedRows.length) {
      const [existingReservation] = await tx
        .select({
          periodStart: analysisCreditReservations.periodStart,
          userId: analysisCreditReservations.userId,
        })
        .from(analysisCreditReservations)
        .where(eq(analysisCreditReservations.id, reservationId))

      if (!existingReservation) {
        throw new Error(`Credit reservation ${reservationId} not found`)
      }

      return getStatusInTransaction(tx, existingReservation.userId, existingReservation.periodStart)
    }

    changed = true

    const [monthRow] = await tx
      .update(analysisCreditMonths)
      .set({
        reservedCount: sql`greatest(${analysisCreditMonths.reservedCount} - 1, 0)`,
        consumedCount:
          mode === 'consumed'
            ? sql`${analysisCreditMonths.consumedCount} + 1`
            : analysisCreditMonths.consumedCount,
        updatedAt: now,
      })
      .where(
        and(
          eq(analysisCreditMonths.userId, finalizedRows[0].userId),
          eq(analysisCreditMonths.periodStart, finalizedRows[0].periodStart),
        ),
      )
      .returning({
        periodStart: analysisCreditMonths.periodStart,
        creditLimit: analysisCreditMonths.creditLimit,
        consumedCount: analysisCreditMonths.consumedCount,
        reservedCount: analysisCreditMonths.reservedCount,
      })

    if (!monthRow) {
      throw new Error(`Credit month ${finalizedRows[0].periodStart} not found`)
    }

    return toCreditStatus(monthRow)
  })

  if (changed) {
    console.info(
      `[credits] reservation ${reservationId} finalized as ${mode} for period ${status.periodStart}; remaining=${status.remaining}`,
    )
  }
  emitCreditsUpdated(status)
  return status
}

export async function finalizeCreditReservationSuccess(reservationId: string): Promise<CreditStatus> {
  return finalizeReservation(reservationId, 'consumed')
}

export async function finalizeCreditReservationFailure(
  reservationId: string,
  reason?: string,
): Promise<CreditStatus> {
  return finalizeReservation(reservationId, 'released', reason)
}

import postgres from 'postgres'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CreditExhaustedError,
  finalizeCreditReservationFailure,
  finalizeCreditReservationSuccess,
  getCreditStatus,
  reserveCredit,
} from './credits'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required for credits tests')
}

if (!DATABASE_URL.includes('_test')) {
  throw new Error(`Refusing to run credits tests on non-test database: ${DATABASE_URL}`)
}

const sql = postgres(DATABASE_URL)

const TEST_USER_ID = 'test-user-credits'

function toPeriodStartUTC(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`
}

async function resetCreditsRelatedTables() {
  await sql`
    TRUNCATE TABLE
      analysis_credit_reservations,
      analysis_credit_months,
      problems,
      problem_clusters,
      newsletters
    RESTART IDENTITY CASCADE
  `
}

async function createNewsletter(subject: string) {
  const rows = await sql<{ id: string }[]>`
    INSERT INTO newsletters (user_id, subject, markdown_body, source_type)
    VALUES (${TEST_USER_ID}, ${subject}, ${`body for ${subject}`}, ${'file'})
    RETURNING id
  `

  return rows[0].id
}

async function createNewsletters(count: number) {
  const ids: string[] = []

  for (let i = 0; i < count; i++) {
    ids.push(await createNewsletter(`newsletter-${i}`))
  }

  return ids
}

describe('credits service', () => {
  beforeAll(async () => {
    await sql`SELECT 1`
  })

  beforeEach(async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await resetCreditsRelatedTables()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await sql.end({ timeout: 1 })
  })

  it('caps concurrent reservations at 50 and rejects overflow', async () => {
    const newsletterIds = await createNewsletters(60)

    const results = await Promise.allSettled(
      newsletterIds.map(newsletterId => reserveCredit({ newsletterId, userId: TEST_USER_ID, source: 'batch' })),
    )

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<{ reservationId: string }> => result.status === 'fulfilled',
    )

    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )

    expect(fulfilled).toHaveLength(50)
    expect(rejected).toHaveLength(10)
    expect(rejected.every(result => result.reason instanceof CreditExhaustedError)).toBe(true)

    const status = await getCreditStatus(TEST_USER_ID)
    expect(status.limit).toBe(50)
    expect(status.consumed).toBe(0)
    expect(status.reserved).toBe(50)
    expect(status.remaining).toBe(0)
    expect(status.exhausted).toBe(true)
  })

  it('counts consumed on success and refunds on failure', async () => {
    const successNewsletterId = await createNewsletter('success-newsletter')
    const failedNewsletterId = await createNewsletter('failed-newsletter')

    const successReservation = await reserveCredit({
      newsletterId: successNewsletterId,
      userId: TEST_USER_ID,
      source: 'manual',
    })
    const failedReservation = await reserveCredit({
      newsletterId: failedNewsletterId,
      userId: TEST_USER_ID,
      source: 'manual',
    })

    await finalizeCreditReservationSuccess(successReservation.reservationId)
    await finalizeCreditReservationFailure(failedReservation.reservationId, 'forced_test_failure')

    const status = await getCreditStatus(TEST_USER_ID)
    expect(status.limit).toBe(50)
    expect(status.consumed).toBe(1)
    expect(status.reserved).toBe(0)
    expect(status.remaining).toBe(49)
    expect(status.exhausted).toBe(false)
  })

  it('is idempotent when finalizing the same reservation more than once', async () => {
    const newsletterId = await createNewsletter('idempotent-finalize')
    const reservation = await reserveCredit({
      newsletterId,
      userId: TEST_USER_ID,
      source: 'manual',
    })

    await finalizeCreditReservationSuccess(reservation.reservationId)
    const afterFirstFinalize = await getCreditStatus(TEST_USER_ID)

    await finalizeCreditReservationSuccess(reservation.reservationId)
    await finalizeCreditReservationFailure(reservation.reservationId, 'should_not_change')
    const afterRepeatedFinalize = await getCreditStatus(TEST_USER_ID)

    expect(afterFirstFinalize).toEqual(afterRepeatedFinalize)
    expect(afterRepeatedFinalize.consumed).toBe(1)
    expect(afterRepeatedFinalize.reserved).toBe(0)
    expect(afterRepeatedFinalize.remaining).toBe(49)
  })

  it('releases expired reservations before creating a new one', async () => {
    const newsletterIds = await createNewsletters(50)

    await Promise.all(
      newsletterIds.map(newsletterId => reserveCredit({ newsletterId, userId: TEST_USER_ID, source: 'batch' })),
    )

    await sql`
      UPDATE analysis_credit_reservations
      SET expires_at = now() - interval '2 hour'
      WHERE status = 'reserved'
    `

    const extraNewsletterId = await createNewsletter('after-expiration')
    const extraReservation = await reserveCredit({
      newsletterId: extraNewsletterId,
      userId: TEST_USER_ID,
      source: 'manual',
    })

    expect(extraReservation.reservationId).toBeTruthy()

    const status = await getCreditStatus(TEST_USER_ID)
    expect(status.consumed).toBe(0)
    expect(status.reserved).toBe(1)
    expect(status.remaining).toBe(49)
    expect(status.exhausted).toBe(false)
  })

  it('resets quota on a new month even if the previous month is exhausted', async () => {
    const februaryNow = new Date('2026-02-15T12:00:00.000Z')
    const marchNow = new Date('2026-03-02T09:00:00.000Z')
    const newsletterIds = await createNewsletters(52)

    await Promise.all(
      newsletterIds.slice(0, 50).map(newsletterId => reserveCredit({ newsletterId, userId: TEST_USER_ID, source: 'batch', now: februaryNow })),
    )

    await expect(
      reserveCredit({ newsletterId: newsletterIds[50], userId: TEST_USER_ID, source: 'batch', now: februaryNow }),
    ).rejects.toBeInstanceOf(CreditExhaustedError)

    const marchReservation = await reserveCredit({
      newsletterId: newsletterIds[51],
      userId: TEST_USER_ID,
      source: 'batch',
      now: marchNow,
    })
    expect(marchReservation.reservationId).toBeTruthy()

    const februaryStatus = await getCreditStatus(TEST_USER_ID, februaryNow)
    expect(februaryStatus.periodStart).toBe('2026-02-01')
    expect(februaryStatus.reserved).toBe(50)
    expect(februaryStatus.remaining).toBe(0)
    expect(februaryStatus.exhausted).toBe(true)

    const marchStatus = await getCreditStatus(TEST_USER_ID, marchNow)
    expect(marchStatus.periodStart).toBe('2026-03-01')
    expect(marchStatus.reserved).toBe(1)
    expect(marchStatus.remaining).toBe(49)
    expect(marchStatus.exhausted).toBe(false)
  })

  it('allows only one additional reservation when month already has 49 consumed', async () => {
    const now = new Date('2026-04-10T10:00:00.000Z')
    const periodStart = toPeriodStartUTC(now)

    await sql`
      INSERT INTO analysis_credit_months (user_id, period_start, credit_limit, reserved_count, consumed_count)
      VALUES (${TEST_USER_ID}, ${periodStart}, 50, 0, 49)
    `

    const newsletterIds = await createNewsletters(10)
    const results = await Promise.allSettled(
      newsletterIds.map(newsletterId => reserveCredit({ newsletterId, userId: TEST_USER_ID, source: 'manual', now })),
    )

    const fulfilled = results.filter((result): result is PromiseFulfilledResult<{ reservationId: string }> => result.status === 'fulfilled')
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(9)
    expect(rejected.every(result => result.reason instanceof CreditExhaustedError)).toBe(true)

    const status = await getCreditStatus(TEST_USER_ID, now)
    expect(status.consumed).toBe(49)
    expect(status.reserved).toBe(1)
    expect(status.remaining).toBe(0)
    expect(status.exhausted).toBe(true)
  })

  it('keeps counters stable when the same reservation is finalized concurrently', async () => {
    const newsletterId = await createNewsletter('concurrent-finalization')
    const reservation = await reserveCredit({
      newsletterId,
      userId: TEST_USER_ID,
      source: 'manual',
    })

    await Promise.all([
      finalizeCreditReservationSuccess(reservation.reservationId),
      finalizeCreditReservationSuccess(reservation.reservationId),
      finalizeCreditReservationSuccess(reservation.reservationId),
    ])

    const status = await getCreditStatus(TEST_USER_ID)
    expect(status.consumed).toBe(1)
    expect(status.reserved).toBe(0)
    expect(status.remaining).toBe(49)
  })

  it('throws a clear error when finalizing an unknown reservation', async () => {
    await expect(
      finalizeCreditReservationFailure('00000000-0000-0000-0000-000000000000', 'missing'),
    ).rejects.toThrow('not found')
  })
})

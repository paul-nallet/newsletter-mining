import { and, asc, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'
import { getQuery } from 'h3'
import type { NewsletterListItem, NewsletterPageResponse } from '#shared/types/newsletter'
import { useDB } from '../../database'
import { newsletters, problems } from '../../database/schema'

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return parsed
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const db = useDB()
  const query = getQuery(event)

  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const analyzed = query.analyzed === 'yes' || query.analyzed === 'no' || query.analyzed === 'all'
    ? query.analyzed
    : 'all'
  const source = query.source === 'file' || query.source === 'email' || query.source === 'all'
    ? query.source
    : 'all'
  const sort = query.sort === 'asc' || query.sort === 'desc'
    ? query.sort
    : 'desc'
  const limit = Math.min(parsePositiveInt(query.limit, 0), 100)
  const offset = parsePositiveInt(query.offset, 0)
  const isPaginated = limit > 0

  const whereParts = [eq(newsletters.userId, userId), isNull(newsletters.deletedAt)]

  if (q) {
    const pattern = `%${q}%`
    whereParts.push(
      or(
        ilike(newsletters.subject, pattern),
        ilike(newsletters.fromName, pattern),
        ilike(newsletters.fromEmail, pattern),
      )!,
    )
  }

  if (analyzed === 'yes') whereParts.push(eq(newsletters.analyzed, true))
  if (analyzed === 'no') whereParts.push(eq(newsletters.analyzed, false))
  if (source === 'file') whereParts.push(eq(newsletters.sourceType, 'file'))
  if (source === 'email') whereParts.push(eq(newsletters.sourceType, 'mailgun'))

  const whereClause = and(...whereParts)
  const primaryOrder = sort === 'asc' ? asc(newsletters.receivedAt) : desc(newsletters.receivedAt)
  const secondaryOrder = sort === 'asc' ? asc(newsletters.id) : desc(newsletters.id)

  const problemCounts = db
    .select({
      newsletterId: problems.newsletterId,
      problemCount: count(problems.id).as('problem_count'),
    })
    .from(problems)
    .where(eq(problems.userId, userId))
    .groupBy(problems.newsletterId)
    .as('problem_counts')

  const baseQuery = db
    .select({
      id: newsletters.id,
      subject: newsletters.subject,
      fromEmail: newsletters.fromEmail,
      fromName: newsletters.fromName,
      receivedAt: newsletters.receivedAt,
      analyzed: newsletters.analyzed,
      analyzedAt: newsletters.analyzedAt,
      sourceType: newsletters.sourceType,
      sourceVertical: newsletters.sourceVertical,
      problemCount: sql<number>`coalesce(${problemCounts.problemCount}, 0)`.as('problem_count'),
    })
    .from(newsletters)
    .leftJoin(problemCounts, eq(problemCounts.newsletterId, newsletters.id))
    .where(whereClause)
    .orderBy(primaryOrder, secondaryOrder)

  const rows = await baseQuery
    .limit(isPaginated ? limit : undefined)
    .offset(isPaginated ? offset : undefined)

  const normalizedRows: NewsletterListItem[] = rows.map(row => ({
    ...row,
    problemCount: Number(row.problemCount ?? 0),
  }))

  if (!isPaginated) {
    return normalizedRows
  }

  const [totalRow] = await db.select({ total: count() }).from(newsletters).where(whereClause)
  const [pendingRow] = await db.select({ total: count() }).from(newsletters).where(
    and(eq(newsletters.userId, userId), eq(newsletters.analyzed, false), isNull(newsletters.deletedAt)),
  )
  const total = Number(totalRow?.total ?? 0)
  const pendingTotal = Number(pendingRow?.total ?? 0)
  const nextOffset = offset + normalizedRows.length
  const hasMore = nextOffset < total

  const response: NewsletterPageResponse = {
    items: normalizedRows,
    total,
    pendingTotal,
    limit,
    offset,
    nextOffset: hasMore ? nextOffset : null,
    hasMore,
  }

  return response
})

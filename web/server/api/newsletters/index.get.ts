import { desc, count, eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { newsletters, problems } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const rows = await db
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
      problemCount: count(problems.id),
    })
    .from(newsletters)
    .leftJoin(problems, eq(problems.newsletterId, newsletters.id))
    .groupBy(newsletters.id)
    .orderBy(desc(newsletters.receivedAt))

  return rows.map(row => ({
    ...row,
    // postgres count can come as string depending on driver; normalize for UI
    problemCount: Number(row.problemCount ?? 0),
  }))
})

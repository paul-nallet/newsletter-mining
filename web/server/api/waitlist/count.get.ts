import { sql } from 'drizzle-orm'
import { useDB } from '../../database'
import { waitlistSignups } from '../../database/schema'

export default defineCachedEventHandler(async () => {
  const db = useDB()
  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(waitlistSignups)
  return { total: result?.count ?? 0 }
}, {
  maxAge: 300,
  name: 'waitlist-count',
})

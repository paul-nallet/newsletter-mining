import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { useDB } from '../database'
import { userProfiles } from '../database/schema'

const INGEST_DOMAIN = 'ingest.newsletter-mining.com'

export function generateIngestEmail(): string {
  const id = crypto.randomBytes(4).toString('hex') // 8 hex chars
  return `nl-${id}@${INGEST_DOMAIN}`
}

export async function getUserByIngestEmail(email: string): Promise<string | null> {
  const db = useDB()
  const [row] = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.ingestEmail, email))
  return row?.userId ?? null
}

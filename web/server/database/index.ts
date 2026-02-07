import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle> | null = null

export function useDB() {
  if (!_db) {
    const config = useRuntimeConfig()
    const connectionString = config.databaseUrl
      || 'postgresql://newsletter:newsletter_dev@localhost:5432/newsletter_mining'
    const client = postgres(connectionString)
    _db = drizzle(client, { schema })
  }
  return _db
}

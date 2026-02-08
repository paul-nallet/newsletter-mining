import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'
import { usePgClient } from './client'

let _db: ReturnType<typeof drizzle> | null = null

export function useDB() {
  if (!_db) {
    const client = usePgClient()
    _db = drizzle(client, { schema })
  }
  return _db
}

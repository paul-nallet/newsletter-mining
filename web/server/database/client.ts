import postgres from 'postgres'
import type { Sql } from 'postgres'

let _client: Sql | null = null

export function usePgClient() {
  if (!_client) {
    const connectionString = process.env.NUXT_DATABASE_URL
      || process.env.DATABASE_URL
      || 'postgresql://newsletter:newsletter_dev@localhost:5432/newsletter_mining'
    _client = postgres(connectionString)
  }
  return _client
}

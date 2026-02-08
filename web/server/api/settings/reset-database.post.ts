import { getHeaders, readBody } from 'h3'
import { usePgClient } from '~~/server/database/client'

const RESET_CONFIRMATION = 'RESET DATABASE'
const EXCLUDED_TABLES = new Set(['__drizzle_migrations'])

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: new Headers(getHeaders(event) as HeadersInit),
  })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const body = await readBody<{ confirmation?: string }>(event)
  if (body?.confirmation !== RESET_CONFIRMATION) {
    throw createError({
      statusCode: 400,
      statusMessage: `Confirmation text must be exactly "${RESET_CONFIRMATION}".`,
    })
  }

  const sql = usePgClient()
  const tableRows = await sql<{ tablename: string }[]>`
    select tablename
    from pg_tables
    where schemaname = 'public'
    order by tablename asc
  `

  const tablesToTruncate = tableRows
    .map(row => row.tablename)
    .filter(tableName => !EXCLUDED_TABLES.has(tableName))

  await sql.begin(async (tx) => {
    for (const tableName of tablesToTruncate) {
      const escapedTableName = tableName.replace(/"/g, '""')
      await tx.unsafe(`TRUNCATE TABLE "public"."${escapedTableName}" RESTART IDENTITY CASCADE`)
    }
  })

  console.info(`[settings] database reset by ${session.user.email ?? session.user.id}; truncated ${tablesToTruncate.length} tables`)

  return {
    success: true,
    truncatedTables: tablesToTruncate.length,
  }
})

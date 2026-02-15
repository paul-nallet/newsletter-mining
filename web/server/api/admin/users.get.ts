import { usePgClient } from '../../database/client'
import { requireAdmin } from '../../utils/admin'

interface UserRow {
  id: string
  email: string
  name: string
  createdAt: string
  ingestEmail: string | null
  newslettersCount: number
  problemsCount: number
}

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)
  const pgClient = usePgClient()

  const users = await pgClient<UserRow[]>`
    select
      u.id,
      u.email,
      u.name,
      u."createdAt" as "createdAt",
      up.ingest_email as "ingestEmail",
      (
        select count(*)
        from newsletters n
        where n.user_id = u.id and n.deleted_at is null
      )::int as "newslettersCount",
      (
        select count(*)
        from problems p
        where p.user_id = u.id
      )::int as "problemsCount"
    from "user" u
    left join user_profiles up on up.user_id = u.id
    order by u."createdAt" desc
  `

  console.info(`[admin] user list viewed by ${user.id} (${users.length} user(s))`)

  return { users }
})

import { usePgClient } from '../../database/client'
import { requireAdmin } from '../../utils/admin'

interface UserRow {
  id: string
  email: string
  currentPlan: string
  creditsCount: number
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
      coalesce(active_sub.plan, latest_sub.plan, 'starter') as "currentPlan",
      coalesce(
        greatest(acm.credit_limit - acm.reserved_count - acm.consumed_count, 0),
        case coalesce(active_sub.plan, latest_sub.plan, 'starter')
          when 'growth' then 500
          when 'studio' then 2000
          else 50
        end
      )::int as "creditsCount",
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
    left join lateral (
      select s.plan
      from subscription s
      where s."referenceId" = u.id
        and s.status in ('active', 'trialing')
      order by s."updatedAt" desc nulls last
      limit 1
    ) active_sub on true
    left join lateral (
      select s.plan
      from subscription s
      where s."referenceId" = u.id
      order by s."updatedAt" desc nulls last
      limit 1
    ) latest_sub on true
    left join lateral (
      select acm.credit_limit, acm.reserved_count, acm.consumed_count
      from analysis_credit_months acm
      where acm.user_id = u.id
      order by acm.period_start desc
      limit 1
    ) acm on true
    order by u."createdAt" desc
  `

  console.info(`[admin] user list viewed by ${user.id} (${users.length} user(s))`)

  return { users }
})

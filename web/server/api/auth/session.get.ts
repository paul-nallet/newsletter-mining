import { getHeaders } from 'h3'
import { isAdminEmail } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: new Headers(getHeaders(event) as HeadersInit),
  })

  return {
    authenticated: Boolean(session?.user),
    user: session?.user ?? null,
    isAdmin: isAdminEmail(session?.user?.email),
  }
})

import { getHeaders } from 'h3'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: new Headers(getHeaders(event) as HeadersInit),
  })

  return {
    authenticated: Boolean(session?.user),
    user: session?.user ?? null,
  }
})

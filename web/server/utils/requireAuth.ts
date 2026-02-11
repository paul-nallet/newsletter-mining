import { getHeaders, type H3Event } from 'h3'

export async function requireAuth(event: H3Event) {
  const session = await auth.api.getSession({
    headers: new Headers(getHeaders(event) as HeadersInit),
  })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  return { userId: session.user.id, user: session.user }
}

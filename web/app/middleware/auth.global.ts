const publicPaths = new Set(['/', '/login', '/register'])
const authPaths = new Set(['/login', '/register'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/_nuxt') || to.path.startsWith('/__nuxt_error')) {
    return
  }

  const isPublic = publicPaths.has(to.path)
  const isAuthPath = authPaths.has(to.path)

  const { session, fetch } = useAuthSession()

  // Always fetch fresh session data on each navigation
  await fetch()

  const isAuthenticated = session.value.authenticated

  if (!isAuthenticated && !isPublic) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (isAuthenticated && isAuthPath) {
    return navigateTo('/app')
  }
})

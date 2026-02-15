const authPaths = new Set(['/login', '/register'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/_nuxt') || to.path.startsWith('/__nuxt_error')) {
    return
  }

  const isAppPath = to.path === '/app' || to.path.startsWith('/app/')
  const isAdminPath = to.path === '/app/admin' || to.path.startsWith('/app/admin/')
  const isAuthPath = authPaths.has(to.path)

  const { session, fetch } = useAuthSession()

  // Always fetch fresh session data on each navigation
  await fetch()

  const isAuthenticated = session.value.authenticated

  if (!isAuthenticated && isAppPath) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (isAuthenticated && isAuthPath) {
    return navigateTo('/app')
  }

  if (isAdminPath && !session.value.isAdmin) {
    return navigateTo('/app')
  }
})

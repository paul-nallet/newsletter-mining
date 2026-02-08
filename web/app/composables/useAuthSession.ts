interface AuthSession {
  authenticated: boolean
  user: { id: string; email: string; name: string } | null
}

const defaultSession: AuthSession = { authenticated: false, user: null }

export function useAuthSession() {
  const session = useState<AuthSession>('auth-session', () => defaultSession)

  async function fetch() {
    if (import.meta.server) {
      // During SSR, use useRequestFetch which automatically forwards cookies/headers
      // and is handled internally by Nitro without an actual HTTP roundtrip
      const requestFetch = useRequestFetch()
      const result = await requestFetch<AuthSession>('/api/auth/session')
      session.value = result
    } else {
      const result = await $fetch<AuthSession>('/api/auth/session')
      session.value = result
    }
    return session.value
  }

  function clear() {
    session.value = { ...defaultSession }
  }

  return { session, fetch, clear }
}

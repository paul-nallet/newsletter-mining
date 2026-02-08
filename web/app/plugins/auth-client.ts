import { authClient } from '~/lib/auth-client'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      auth: authClient,
    },
  }
})

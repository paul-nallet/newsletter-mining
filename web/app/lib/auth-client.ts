import { createAuthClient } from 'better-auth/vue'

const serverBaseURL = process.env.NUXT_BETTER_AUTH_URL
  || process.env.BETTER_AUTH_URL
  || process.env.NUXT_SITE_URL
  || process.env.APP_URL
  || 'http://localhost:3000'

export const authClient = createAuthClient({
  baseURL: process.server ? serverBaseURL : window.location.origin,
  basePath: '/api/auth',
})

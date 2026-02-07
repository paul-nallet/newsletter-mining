import { config } from 'dotenv'
import { resolve } from 'node:path'

// Load .env from project root (parent of web/)
config({ path: resolve(__dirname, '../.env') })

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Support both Nuxt-prefixed env vars and plain env vars for Docker/VPS setup.
    openaiApiKey: process.env.NUXT_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
    databaseUrl: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || '',
    mailgunWebhookSigningKey: process.env.NUXT_MAILGUN_WEBHOOK_SIGNING_KEY || process.env.MAILGUN_WEBHOOK_SIGNING_KEY || '',
  },

  devtools: { enabled: true },
  compatibilityDate: '2025-01-01',
})

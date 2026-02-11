import { config } from 'dotenv'
import { resolve } from 'node:path'

// Load .env from project root (parent of web/)
config({ path: resolve(__dirname, '../.env') })

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/mdc'],
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Support both Nuxt-prefixed env vars and plain env vars for Docker/VPS setup.
    openaiApiKey: process.env.NUXT_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
    databaseUrl: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || '',
    mailgunWebhookSigningKey: process.env.NUXT_MAILGUN_WEBHOOK_SIGNING_KEY || process.env.MAILGUN_WEBHOOK_SIGNING_KEY || '',
    clusterSimilarityThreshold: process.env.NUXT_CLUSTER_SIMILARITY_THRESHOLD || process.env.CLUSTER_SIMILARITY_THRESHOLD || '0.78',
    betterAuthSecret: process.env.NUXT_BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET || '',
    betterAuthUrl: process.env.NUXT_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || '',
    stripeSecretKey: process.env.NUXT_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.NUXT_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '',
    stripePriceGrowthMonthly: process.env.NUXT_STRIPE_PRICE_GROWTH_MONTHLY || process.env.STRIPE_PRICE_GROWTH_MONTHLY || '',
    stripePriceGrowthYearly: process.env.NUXT_STRIPE_PRICE_GROWTH_YEARLY || process.env.STRIPE_PRICE_GROWTH_YEARLY || '',
    stripePriceStudioMonthly: process.env.NUXT_STRIPE_PRICE_STUDIO_MONTHLY || process.env.STRIPE_PRICE_STUDIO_MONTHLY || '',
    stripePriceStudioYearly: process.env.NUXT_STRIPE_PRICE_STUDIO_YEARLY || process.env.STRIPE_PRICE_STUDIO_YEARLY || '',
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '0 6 * * *': ['analyze:pending'],
    },
  },


  devtools: { enabled: true },
  compatibilityDate: '2026-01-01',
})

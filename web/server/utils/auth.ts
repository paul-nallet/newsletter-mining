import { config } from 'dotenv'
import { resolve } from 'node:path'
import { betterAuth } from 'better-auth'
import { stripe } from '@better-auth/stripe'
import Stripe from 'stripe'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { generateIngestEmail } from './ingestEmail'
import { syncCreditLimit } from './syncCreditLimit'
import { useDB } from '../database'
import { userProfiles } from '../database/schema'

config({ path: resolve(process.cwd(), '../.env') })

const secret = process.env.BETTER_AUTH_SECRET || process.env.NUXT_BETTER_AUTH_SECRET || ''
if (!secret) {
  throw new Error('Missing BETTER_AUTH_SECRET (or NUXT_BETTER_AUTH_SECRET).')
}

const baseURL = process.env.BETTER_AUTH_URL
  || process.env.NUXT_BETTER_AUTH_URL
  || process.env.NUXT_SITE_URL
  || process.env.APP_URL
  || 'http://localhost:3000'

const connectionString = process.env.NUXT_DATABASE_URL
  || process.env.DATABASE_URL
  || 'postgresql://newsletter:newsletter_dev@localhost:5432/newsletter_mining'

const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString }),
  }),
})

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || '')
const googleClientId = process.env.NUXT_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
const googleClientSecret = process.env.NUXT_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''
const isGoogleOAuthEnabled = Boolean(googleClientId && googleClientSecret)

if (!isGoogleOAuthEnabled) {
  console.info('[auth] Google SSO disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.')
}

export const auth = betterAuth({
  secret,
  baseURL,
  basePath: '/api/auth',
  database: {
    db,
    type: 'postgres',
  },
  emailAndPassword: {
    enabled: true,
  },
  ...(isGoogleOAuthEnabled
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        },
      }
    : {}),
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: 'growth',
            priceId: process.env.STRIPE_PRICE_GROWTH_MONTHLY || '',
            annualDiscountPriceId: process.env.STRIPE_PRICE_GROWTH_YEARLY || undefined,
            limits: { credits: 500 },
          },
          {
            name: 'studio',
            priceId: process.env.STRIPE_PRICE_STUDIO_MONTHLY || '',
            annualDiscountPriceId: process.env.STRIPE_PRICE_STUDIO_YEARLY || undefined,
            limits: { credits: 2000 },
          },
        ],
        onSubscriptionComplete: async ({ subscription, plan }) => {
          await syncCreditLimit(subscription.referenceId, plan?.name ?? null)
        },
        onSubscriptionUpdate: async ({ subscription }) => {
          // When plan changes mid-cycle, re-sync
          await syncCreditLimit(subscription.referenceId, subscription.plan ?? null)
        },
        onSubscriptionCancel: async ({ subscription }) => {
          // Will revert at period end; set limit to free now so next period gets free limit
          await syncCreditLimit(subscription.referenceId, null)
        },
        onSubscriptionDeleted: async ({ subscription }) => {
          await syncCreditLimit(subscription.referenceId, null)
        },
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const drizzleDb = useDB()
          const ingestEmail = generateIngestEmail()
          await drizzleDb.insert(userProfiles).values({
            userId: user.id,
            ingestEmail,
          })
          console.info(`[auth] created profile for user ${user.id} with ingest email ${ingestEmail}`)
        },
      },
    },
  },
})

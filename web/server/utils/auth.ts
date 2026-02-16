import { config } from 'dotenv'
import { resolve } from 'node:path'
import { betterAuth } from 'better-auth'
import { stripe } from '@better-auth/stripe'
import Stripe from 'stripe'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { generateIngestEmail } from './ingestEmail'
import { wrapEmailHtml } from './mail'
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
            name: 'starter',
            priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
            annualDiscountPriceId: process.env.STRIPE_PRICE_STARTER_YEARLY
              || process.env.STRIPE_PRICE_STARTER_MONTHLY
              || undefined,
            limits: { credits: 50 },
          },
          {
            name: 'growth',
            priceId: process.env.STRIPE_PRICE_GROWTH_MONTHLY || '',
            annualDiscountPriceId: process.env.STRIPE_PRICE_GROWTH_YEARLY || undefined,
            freeTrial: { days: 14 },
            limits: { credits: 500 },
          },
          {
            name: 'studio',
            priceId: process.env.STRIPE_PRICE_STUDIO_MONTHLY || '',
            annualDiscountPriceId: process.env.STRIPE_PRICE_STUDIO_YEARLY || undefined,
            freeTrial: { days: 14 },
            limits: { credits: 2000 },
          },
        ],
        getCheckoutSessionParams: () => ({
          params: {
            payment_method_collection: 'always',
          },
        }),
        onSubscriptionComplete: async ({ subscription, plan }) => {
          await syncCreditLimit(subscription.referenceId, plan?.name ?? null)
        },
        onSubscriptionUpdate: async ({ subscription }) => {
          // When plan changes mid-cycle, re-sync
          await syncCreditLimit(subscription.referenceId, subscription.plan ?? null)
        },
        onSubscriptionCancel: async ({ subscription }) => {
          // Will revert at period end; set limit to baseline now so next period gets baseline limit
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

          // Send welcome email (non-blocking — must never break signup)
          try {
            const { sendMail } = useNodeMailer()
            const dashboardUrl = `${baseURL}/app/newsletters`
            const greeting = user.name ? `Hi ${user.name},` : 'Hi,'

            const html = wrapEmailHtml(`
              <p style="margin:0 0 16px">${greeting}</p>
              <p style="margin:0 0 16px">Welcome to <strong>ScopeSight</strong>! You're all set to start getting insights from your newsletters.</p>
              <p style="margin:0 0 8px"><strong>Get started in 2 steps:</strong></p>
              <ol style="margin:0 0 16px;padding-left:20px">
                <li style="margin-bottom:8px">Forward your newsletters to your personal ingest address below</li>
                <li style="margin-bottom:8px">ScopeSight automatically analyzes them and surfaces key insights</li>
              </ol>
              <p style="margin:0 0 8px">Your ingest email address:</p>
              <p style="margin:0 0 24px;padding:12px 16px;background-color:#f4f4f5;border-radius:6px;font-family:monospace;font-size:14px;word-break:break-all">${ingestEmail}</p>
              <p style="margin:0 0 24px;text-align:center">
                <a href="${dashboardUrl}" style="display:inline-block;padding:10px 24px;background-color:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600">Go to Dashboard</a>
              </p>
              <p style="margin:0;color:#71717a;font-size:13px">Tip: Set up an auto-forward rule in your email client so new newsletters are sent to your ingest address automatically.</p>
            `, { preheader: 'Your ingest address and quickstart guide' })

            const text = [
              greeting,
              '',
              'Welcome to ScopeSight! You\'re all set to start getting insights from your newsletters.',
              '',
              'Get started in 2 steps:',
              `1. Forward your newsletters to: ${ingestEmail}`,
              '2. ScopeSight automatically analyzes them and surfaces key insights',
              '',
              `Go to your dashboard: ${dashboardUrl}`,
              '',
              'Tip: Set up an auto-forward rule in your email client so new newsletters are sent to your ingest address automatically.',
            ].join('\n')

            await sendMail({
              to: user.email,
              subject: 'Welcome to ScopeSight',
              html,
              text,
            })
            console.info(`[auth] welcome email sent to ${user.email}`)
          }
          catch (err) {
            console.error('[auth] failed to send welcome email:', err)
          }
        },
      },
    },
  },
})

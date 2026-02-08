import { config } from 'dotenv'
import { resolve } from 'node:path'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { Kysely, PostgresDialect, sql } from 'kysely'
import { Pool } from 'pg'

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
  plugins: [
    {
      id: 'single-user-signup-guard',
      hooks: {
        before: [
          {
            matcher(ctx) {
              return ctx.path === '/sign-up/email'
            },
            handler: createAuthMiddleware(async () => {
              const result = await sql<{ count: number }>`select count(*)::int as count from "user"`.execute(db)
              const existingUsers = result.rows[0]?.count ?? 0
              if (existingUsers > 0) {
                throw new APIError('FORBIDDEN', {
                  message: 'Registration is closed. This app is configured for a single account.',
                })
              }
            }),
          },
        ],
      },
    },
  ],
})

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL
      || 'postgresql://newsletter:newsletter_dev@localhost:5432/newsletter_mining',
  },
})

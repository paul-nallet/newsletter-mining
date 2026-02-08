import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  date,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
  check,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { vector } from 'drizzle-orm/pg-core'

// --- Enums (matching PRD) ---

export const severityEnum = pgEnum('severity', ['low', 'medium', 'high'])
export const categoryEnum = pgEnum('category', [
  'pricing',
  'feature-gap',
  'ux',
  'performance',
  'integration',
  'other',
])
export const trendEnum = pgEnum('trend', ['emerging', 'stable', 'declining'])
export const sourceTypeEnum = pgEnum('source_type', ['file', 'mailgun'])
export const analysisCreditStatusEnum = pgEnum('analysis_credit_status', ['reserved', 'consumed', 'released'])

// --- Tables (matching PRD section 3.1 F1.3) ---

export const newsletters = pgTable('newsletters', {
  id: uuid('id').defaultRandom().primaryKey(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  fromEmail: text('from_email').default(''),
  fromName: text('from_name').default(''),
  subject: text('subject').default(''),
  htmlBody: text('html_body').default(''),
  textBody: text('text_body').notNull(),
  analyzed: boolean('analyzed').default(false).notNull(),
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
  sourceType: sourceTypeEnum('source_type').notNull().default('file'),
  sourceVertical: varchar('source_vertical', { length: 100 }),
  overallSentiment: text('overall_sentiment'),
  keyTopics: jsonb('key_topics').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const waitlistSignups = pgTable(
  'waitlist_signups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 320 }).notNull(),
    source: varchar('source', { length: 120 }).notNull().default('landing'),
    ipHash: varchar('ip_hash', { length: 128 }).default(''),
    userAgent: text('user_agent').default(''),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex('waitlist_signups_email_unique_idx').on(table.email),
    index('waitlist_signups_created_at_idx').on(table.createdAt),
  ],
)

export const problems = pgTable(
  'problems',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    newsletterId: uuid('newsletter_id')
      .notNull()
      .references(() => newsletters.id, { onDelete: 'cascade' }),
    problemSummary: text('problem_summary').notNull(),
    problemDetail: text('problem_detail').notNull(),
    category: categoryEnum('category').notNull().default('other'),
    severity: severityEnum('severity').notNull().default('medium'),
    originalQuote: text('original_quote').default(''),
    context: text('context').default(''),
    signals: jsonb('signals').$type<string[]>().default([]),
    mentionedTools: jsonb('mentioned_tools').$type<string[]>().default([]),
    targetAudience: text('target_audience').default(''),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('problems_newsletter_id_idx').on(table.newsletterId),
    index('problems_severity_idx').on(table.severity),
    index('problems_category_idx').on(table.category),
  ],
)

export const problemClusters = pgTable('problem_clusters', {
  id: uuid('id').defaultRandom().primaryKey(),
  clusterName: text('cluster_name').notNull(),
  clusterSummary: text('cluster_summary').default(''),
  problemIds: jsonb('problem_ids').$type<string[]>().default([]),
  firstSeen: timestamp('first_seen', { withTimezone: true }).defaultNow().notNull(),
  lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow().notNull(),
  mentionCount: integer('mention_count').notNull().default(0),
  trend: trendEnum('trend').notNull().default('stable'),
})

export const analysisCreditMonths = pgTable(
  'analysis_credit_months',
  {
    periodStart: date('period_start').primaryKey(),
    creditLimit: integer('credit_limit').notNull().default(50),
    reservedCount: integer('reserved_count').notNull().default(0),
    consumedCount: integer('consumed_count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    check('analysis_credit_months_reserved_non_negative', sql`${table.reservedCount} >= 0`),
    check('analysis_credit_months_consumed_non_negative', sql`${table.consumedCount} >= 0`),
    check('analysis_credit_months_consumed_within_limit', sql`${table.consumedCount} <= ${table.creditLimit}`),
    check('analysis_credit_months_total_within_limit', sql`${table.reservedCount} + ${table.consumedCount} <= ${table.creditLimit}`),
  ],
)

export const analysisCreditReservations = pgTable(
  'analysis_credit_reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    periodStart: date('period_start')
      .notNull()
      .references(() => analysisCreditMonths.periodStart, { onDelete: 'cascade' }),
    newsletterId: uuid('newsletter_id')
      .notNull()
      .references(() => newsletters.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    status: analysisCreditStatusEnum('status').notNull().default('reserved'),
    failureReason: text('failure_reason'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  },
  table => [
    index('analysis_credit_reservations_period_status_idx').on(table.periodStart, table.status),
    index('analysis_credit_reservations_newsletter_status_idx').on(table.newsletterId, table.status),
    index('analysis_credit_reservations_expires_at_idx').on(table.expiresAt),
  ],
)

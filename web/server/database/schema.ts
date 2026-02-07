import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core'
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

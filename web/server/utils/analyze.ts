import { and, count, eq } from 'drizzle-orm'
import { useDB } from '../database'
import { newsletters, problems, userProfiles } from '../database/schema'
import { analyzeNewsletter } from '../services/analyzer'
import { generateClusters, enrichClusterSummaries } from '../services/clustering'
import type { AnalysisCreditSource } from '../services/credits'
import {
  finalizeCreditReservationFailure,
  finalizeCreditReservationSuccess,
  reserveCredit,
} from '../services/credits'
import { generateEmbeddingsBatch } from '../services/embeddings'

export async function analyzeNewsletterById(
  id: string,
  options: { source: AnalysisCreditSource, userId: string },
): Promise<{ problemCount: number }> {
  const db = useDB()

  const [newsletter] = await db
    .select()
    .from(newsletters)
    .where(and(eq(newsletters.id, id), eq(newsletters.userId, options.userId)))

  if (!newsletter) {
    throw new Error(`Newsletter ${id} not found`)
  }

  if (newsletter.analyzed) {
    const [row] = await db
      .select({ value: count(problems.id) })
      .from(problems)
      .where(eq(problems.newsletterId, id))

    return { problemCount: Number(row?.value ?? 0) }
  }

  const reservation = await reserveCredit({
    newsletterId: id,
    userId: options.userId,
    source: options.source,
  })

  let finalized = false

  async function markFailure(reason: string) {
    if (finalized) return
    finalized = true
    await finalizeCreditReservationFailure(reservation.reservationId, reason)
  }

  // 1. Analyze with GPT-4o
  let analysis
  try {
    analysis = await analyzeNewsletter(
      newsletter.markdownBody,
      newsletter.subject || '',
      newsletter.fromName || '',
      newsletter.receivedAt?.toISOString() || '',
    )
  }
  catch (error) {
    await markFailure('analysis_error')
    throw error
  }

  // 2. Generate embeddings for all problems
  const texts = analysis.extracted_problems.map(
    (p) => {
      const summary = p.problem_summary?.trim() || p.problem_detail?.trim() || ''
      return `${summary}\nCategory: ${p.category}`
    },
  )

  let embeddings: number[][] = []
  try {
    embeddings = await generateEmbeddingsBatch(texts)
  }
  catch (e) {
    console.warn('Failed to generate embeddings, storing problems without them:', e)
  }

  // 3. Insert extracted problems and mark newsletter as analyzed atomically.
  let insertedCount = 0
  try {
    insertedCount = await db.transaction(async (tx) => {
      let countInserted = 0

      for (let i = 0; i < analysis.extracted_problems.length; i++) {
        const p = analysis.extracted_problems[i]
        await tx.insert(problems).values({
          userId: options.userId,
          newsletterId: id,
          problemSummary: p.problem_summary,
          problemDetail: p.problem_detail,
          category: p.category,
          severity: p.severity,
          originalQuote: p.original_quote,
          context: p.context,
          signals: p.signals,
          mentionedTools: p.mentioned_tools,
          targetAudience: p.target_audience,
          embedding: embeddings[i] || null,
        })
        countInserted++
      }

      await tx
        .update(newsletters)
        .set({
          analyzed: true,
          analyzedAt: new Date(),
          overallSentiment: analysis.overall_sentiment,
          keyTopics: analysis.key_topics,
        })
        .where(eq(newsletters.id, id))

      return countInserted
    })
  }
  catch (error) {
    await markFailure('db_transaction_error')
    throw error
  }

  await finalizeCreditReservationSuccess(reservation.reservationId)
  finalized = true

  // Auto-recluster if user has it enabled
  try {
    const [profile] = await db
      .select({ autoRecluster: userProfiles.autoRecluster })
      .from(userProfiles)
      .where(eq(userProfiles.userId, options.userId))
    if (profile?.autoRecluster) {
      await generateClusters(options.userId)
      await enrichClusterSummaries(options.userId)
    }
  }
  catch (e) {
    console.warn('[analyze] Auto-recluster failed:', e)
  }

  return { problemCount: insertedCount }
}

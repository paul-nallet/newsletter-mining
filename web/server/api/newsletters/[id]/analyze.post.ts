import { eq } from 'drizzle-orm'
import { useDB } from '../../../database'
import { newsletters, problems } from '../../../database/schema'
import { analyzeNewsletter } from '../../../services/analyzer'
import { generateEmbeddingsBatch } from '../../../services/embeddings'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDB()

  const [newsletter] = await db
    .select()
    .from(newsletters)
    .where(eq(newsletters.id, id))

  if (!newsletter) {
    throw createError({ statusCode: 404, statusMessage: 'Newsletter not found' })
  }

  // 1. Analyze with GPT-4o (PRD prompt)
  const analysis = await analyzeNewsletter(
    newsletter.textBody,
    newsletter.subject || '',
    newsletter.fromName || '',
    newsletter.receivedAt?.toISOString() || '',
  )

  // 2. Update newsletter metadata
  await db
    .update(newsletters)
    .set({
      analyzed: true,
      analyzedAt: new Date(),
      overallSentiment: analysis.overall_sentiment,
      keyTopics: analysis.key_topics,
    })
    .where(eq(newsletters.id, id))

  // 3. Generate embeddings for all problems
  const texts = analysis.extracted_problems.map(
    p => `${p.problem_summary}. ${p.problem_detail}`,
  )

  let embeddings: number[][] = []
  try {
    embeddings = await generateEmbeddingsBatch(texts)
  }
  catch (e) {
    console.warn('Failed to generate embeddings, storing problems without them:', e)
  }

  // 4. Insert problems with embeddings
  const inserted = []
  for (let i = 0; i < analysis.extracted_problems.length; i++) {
    const p = analysis.extracted_problems[i]
    const [row] = await db.insert(problems).values({
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
    }).returning()
    inserted.push(row)
  }

  return {
    newsletterId: id,
    problemCount: inserted.length,
    overallSentiment: analysis.overall_sentiment,
    keyTopics: analysis.key_topics,
  }
})

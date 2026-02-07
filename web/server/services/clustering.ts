import OpenAI from 'openai'
import { eq, isNotNull, sql } from 'drizzle-orm'
import { useDB } from '../database'
import { problems, problemClusters } from '../database/schema'

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const norm = Math.sqrt(normA) * Math.sqrt(normB)
  return norm === 0 ? 0 : dot / norm
}

function centroid(vectors: number[][]): number[] {
  const dim = vectors[0].length
  const result = new Array(dim).fill(0)
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) result[i] += v[i]
  }
  for (let i = 0; i < dim; i++) result[i] /= vectors.length
  return result
}

// PRD Section 5.2 - Cluster summary prompt
const CLUSTER_SUMMARY_PROMPT = `You are analyzing a cluster of similar problems extracted from multiple newsletters.

# Your Task
Generate:
1. A clear, concise name for this cluster (3-6 words)
2. A summary that captures the common thread across all these problems (2-3 sentences)

The name should be specific and actionable (e.g., "High API monitoring costs for startups" not "API problems").

The summary should:
- Identify the core issue
- Mention the affected audience
- Note any common workarounds or implications

Return as JSON:
{
  "cluster_name": "...",
  "cluster_summary": "..."
}`

export async function generateClusters(threshold = 0.85) {
  const db = useDB()

  // 1. Fetch all problems with embeddings
  const allProblems = await db
    .select({
      id: problems.id,
      embedding: problems.embedding,
      problemSummary: problems.problemSummary,
      problemDetail: problems.problemDetail,
      createdAt: problems.createdAt,
    })
    .from(problems)
    .where(isNotNull(problems.embedding))

  if (allProblems.length === 0) return

  // 2. Incremental clustering (PRD algorithm: cosine similarity > threshold)
  const groups: { problemIds: string[], embeddings: number[][], firstSeen: Date, lastSeen: Date }[] = []

  for (const p of allProblems) {
    const emb = p.embedding as number[]
    if (!emb) continue

    let bestIdx = -1
    let bestSim = -1

    for (let i = 0; i < groups.length; i++) {
      const ctr = centroid(groups[i].embeddings)
      const sim = cosineSimilarity(emb, ctr)
      if (sim > bestSim) {
        bestSim = sim
        bestIdx = i
      }
    }

    const createdAt = p.createdAt ?? new Date()

    if (bestSim >= threshold && bestIdx >= 0) {
      groups[bestIdx].problemIds.push(p.id)
      groups[bestIdx].embeddings.push(emb)
      if (createdAt < groups[bestIdx].firstSeen) groups[bestIdx].firstSeen = createdAt
      if (createdAt > groups[bestIdx].lastSeen) groups[bestIdx].lastSeen = createdAt
    }
    else {
      groups.push({
        problemIds: [p.id],
        embeddings: [emb],
        firstSeen: createdAt,
        lastSeen: createdAt,
      })
    }
  }

  // 3. Clear old clusters & persist new ones
  await db.delete(problemClusters)

  const problemsById = Object.fromEntries(
    allProblems.map(p => [p.id, p]),
  )

  for (const group of groups) {
    const representative = problemsById[group.problemIds[0]]

    await db.insert(problemClusters).values({
      clusterName: representative?.problemSummary?.slice(0, 80) || 'Unknown',
      problemIds: group.problemIds,
      firstSeen: group.firstSeen,
      lastSeen: group.lastSeen,
      mentionCount: group.problemIds.length,
    })
  }

  return { totalClusters: groups.length, totalProblems: allProblems.length }
}

export async function enrichClusterSummaries() {
  const config = useRuntimeConfig()
  const client = new OpenAI({ apiKey: config.openaiApiKey })
  const db = useDB()

  const clusters = await db.select().from(problemClusters)
  const allProblems = await db
    .select({ id: problems.id, problemSummary: problems.problemSummary, problemDetail: problems.problemDetail })
    .from(problems)

  const problemsById = Object.fromEntries(allProblems.map(p => [p.id, p]))

  for (const cluster of clusters) {
    const problemTexts = (cluster.problemIds || [])
      .map((pid) => {
        const p = problemsById[pid]
        return p ? `- ${p.problemSummary}: ${p.problemDetail}` : null
      })
      .filter(Boolean)

    if (problemTexts.length === 0) continue

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 500,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'system',
          content: CLUSTER_SUMMARY_PROMPT,
        }, {
          role: 'user',
          content: `# Problems in this cluster\n${problemTexts.join('\n')}`,
        }],
      })

      let raw = response.choices[0]?.message?.content || ''
      raw = raw.trim()
      if (raw.startsWith('```')) {
        const lines = raw.split('\n')
        lines.shift()
        if (lines.length && lines[lines.length - 1].trim() === '```') lines.pop()
        raw = lines.join('\n')
      }

      const data = JSON.parse(raw)

      await db
        .update(problemClusters)
        .set({
          clusterName: data.cluster_name || cluster.clusterName,
          clusterSummary: data.cluster_summary || '',
        })
        .where(eq(problemClusters.id, cluster.id))
    }
    catch (e) {
      console.warn(`Failed to enrich cluster ${cluster.id}:`, e)
    }
  }
}

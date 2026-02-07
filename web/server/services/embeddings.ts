import OpenAI from 'openai'

const MODEL = 'text-embedding-3-small'

export async function generateEmbedding(text: string): Promise<number[]> {
  const config = useRuntimeConfig()
  const client = new OpenAI({ apiKey: config.openaiApiKey })

  const response = await client.embeddings.create({
    model: MODEL,
    input: text,
  })

  return response.data[0].embedding
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const config = useRuntimeConfig()
  const client = new OpenAI({ apiKey: config.openaiApiKey })

  const response = await client.embeddings.create({
    model: MODEL,
    input: texts,
  })

  const sorted = [...response.data].sort((a, b) => a.index - b.index)
  return sorted.map(item => item.embedding)
}

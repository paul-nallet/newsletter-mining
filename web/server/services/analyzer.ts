import OpenAI from 'openai'

// PRD Section 5.1 - Extraction prompt
const SYSTEM_PROMPT = `You are an expert analyst specializing in identifying problems, pain points, and unmet needs mentioned in newsletters and articles.

Analyze the following newsletter content and extract all mentioned problems, frustrations, or unmet needs.

# Your Task
Extract every instance where:
1. Someone expresses frustration or complaint about a tool, process, or situation
2. Someone asks a question that implies a missing solution ("how do I...", "is there a way to...")
3. Someone mentions a workaround they use because a proper solution doesn't exist
4. Someone requests a feature or expresses a wish ("I wish...", "it would be great if...")

For each problem found, provide:
- problem_summary: A concise one-sentence description
- problem_detail: More detailed explanation (2-3 sentences)
- category: One of [pricing, feature-gap, ux, performance, integration, other]
- severity: How critical this seems [low, medium, high]
- original_quote: The exact text from the newsletter
- context: Who is affected and in what situation
- signals: Array of applicable signals [frustration, workaround, feature-request, question]
- mentioned_tools: Any tools or products mentioned in relation to this problem
- target_audience: Who seems to be experiencing this problem

Return your analysis as a JSON object following this structure:
{
  "extracted_problems": [...],
  "overall_sentiment": "frustrated|neutral|optimistic",
  "key_topics": ["topic1", "topic2"]
}

Be thorough but precise. Only extract genuine problems, not general observations or positive statements.`

export interface ExtractedProblem {
  problem_summary: string
  problem_detail: string
  category: 'pricing' | 'feature-gap' | 'ux' | 'performance' | 'integration' | 'other'
  severity: 'low' | 'medium' | 'high'
  original_quote: string
  context: string
  signals: string[]
  mentioned_tools: string[]
  target_audience: string
}

export interface AnalysisResponse {
  extracted_problems: ExtractedProblem[]
  overall_sentiment: string
  key_topics: string[]
}

const MODEL = 'gpt-4o'

export async function analyzeNewsletter(
  textBody: string,
  subject: string,
  fromName: string,
  date: string,
): Promise<AnalysisResponse> {
  const config = useRuntimeConfig()
  const client = new OpenAI({ apiKey: config.openaiApiKey })

  const userMessage = `# Newsletter Content

Newsletter: ${subject || 'Unknown'}
Author: ${fromName || 'Unknown'}
Date: ${date || 'Unknown'}

${textBody.slice(0, 15000)}`

  let lastError: Error | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      })

      const rawText = response.choices[0]?.message?.content || ''
      return parseJsonResponse(rawText)
    }
    catch (e) {
      lastError = e as Error
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }

  throw lastError
}

function parseJsonResponse(text: string): AnalysisResponse {
  text = text.trim()
  if (text.startsWith('```')) {
    const lines = text.split('\n')
    lines.shift()
    if (lines.length && lines[lines.length - 1].trim() === '```') {
      lines.pop()
    }
    text = lines.join('\n')
  }
  return JSON.parse(text)
}

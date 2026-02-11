export type NewsletterSourceType = 'file' | 'mailgun'

export type ProblemCategory =
  | 'pricing'
  | 'feature-gap'
  | 'ux'
  | 'performance'
  | 'integration'
  | 'other'

export type ProblemSeverity = 'low' | 'medium' | 'high'

export type NewsletterProblem = {
  id: string
  problemSummary: string
  problemDetail: string
  category: ProblemCategory
  severity: ProblemSeverity
  originalQuote: string | null
  context: string | null
  signals: string[] | null
  mentionedTools: string[] | null
  targetAudience: string | null
  createdAt: string
}

export type Newsletter = {
  id: string
  receivedAt: string
  fromEmail: string | null
  fromName: string | null
  subject: string | null
  markdownBody: string
  analyzed: boolean
  analyzedAt: string | null
  sourceType: NewsletterSourceType
  sourceVertical: string | null
  overallSentiment: string | null
  keyTopics: string[] | null
  deletedAt: string | null
  createdAt: string
}

export type NewsletterListItem = Pick<
  Newsletter,
  'id' | 'subject' | 'fromEmail' | 'fromName' | 'receivedAt' | 'analyzed' | 'analyzedAt' | 'sourceType' | 'sourceVertical'
> & {
  problemCount: number
}

export type NewsletterPageResponse = {
  items: NewsletterListItem[]
  total: number
  pendingTotal: number
  limit: number
  offset: number
  nextOffset: number | null
  hasMore: boolean
}

export type NewsletterDetail = Newsletter & {
  problems: NewsletterProblem[]
}

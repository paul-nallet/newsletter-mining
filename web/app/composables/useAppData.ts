import type { NewsletterListItem } from '#shared/types/newsletter'
import type { CreditStatus } from '#shared/types/credits'

export function useAppData() {
  const stats = useState<Record<string, any> | null>('app-stats', () => null)
  const clusters = useState<any[] | null>('app-clusters', () => null)
  const newsletters = useState<NewsletterListItem[] | null>('app-newsletters', () => null)
  const creditStatus = useState<CreditStatus | null>('app-credit-status', () => null)

  async function fetchStats() {
    const fetcher = import.meta.server ? useRequestFetch() : $fetch
    stats.value = await fetcher('/api/stats')
  }

  async function fetchClusters() {
    const fetcher = import.meta.server ? useRequestFetch() : $fetch
    clusters.value = await fetcher('/api/clusters')
  }

  async function fetchNewsletters() {
    const fetcher = import.meta.server ? useRequestFetch() : $fetch
    newsletters.value = await fetcher<NewsletterListItem[]>('/api/newsletters')
  }

  async function fetchCreditStatus() {
    const fetcher = import.meta.server ? useRequestFetch() : $fetch
    creditStatus.value = await fetcher<CreditStatus>('/api/credits/status')
  }

  const analyzeAllRunning = useState('app-analyze-all-running', () => false)

  return {
    stats,
    clusters,
    newsletters,
    creditStatus,
    analyzeAllRunning,
    fetchStats,
    fetchClusters,
    fetchNewsletters,
    fetchCreditStatus,
  }
}

import type { NewsletterListItem } from '#shared/types/newsletter'

export function useAppData() {
  const stats = useState<Record<string, any> | null>('app-stats', () => null)
  const clusters = useState<any[] | null>('app-clusters', () => null)
  const newsletters = useState<NewsletterListItem[] | null>('app-newsletters', () => null)

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

  const analyzeAllRunning = useState('app-analyze-all-running', () => false)

  return { stats, clusters, newsletters, analyzeAllRunning, fetchStats, fetchClusters, fetchNewsletters }
}

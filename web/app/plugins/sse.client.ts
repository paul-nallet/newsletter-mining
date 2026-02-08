export default defineNuxtPlugin(() => {
  const { fetchStats, fetchClusters, fetchNewsletters, fetchCreditStatus, analyzeAllRunning } = useAppData()
  const toast = useToast()

  let es: EventSource | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let reconnectDelay = 1000

  function connect() {
    es = new EventSource('/api/events')

    es.onopen = () => {
      reconnectDelay = 1000
      fetchCreditStatus()
    }

    es.addEventListener('newsletter:uploaded', () => {
      fetchNewsletters()
    })

    es.addEventListener('newsletter:analyzed', () => {
      fetchNewsletters()
      fetchStats()
      fetchCreditStatus()
    })

    es.addEventListener('clusters:updated', () => {
      fetchClusters()
      fetchStats()
    })

    es.addEventListener('analyze-all:done', (e) => {
      const data = JSON.parse(e.data)
      analyzeAllRunning.value = false
      const skipped = Number(data.skippedDueToCredits ?? 0)
      toast.add({
        title: 'Batch analysis complete',
        description: skipped > 0
          ? `${data.analyzed} analyzed, ${data.failed} failed, ${skipped} skipped (credits).`
          : `${data.analyzed} analyzed, ${data.failed} failed.`,
        color: data.failed || skipped > 0 ? 'warning' : 'success',
      })
    })

    es.addEventListener('credits:updated', () => {
      fetchCreditStatus()
    })

    es.onerror = () => {
      es?.close()
      reconnectTimeout = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30000)
        connect()
      }, reconnectDelay)
    }
  }

  connect()

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      es?.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    })
  }
})

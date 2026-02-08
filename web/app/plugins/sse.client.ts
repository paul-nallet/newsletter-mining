export default defineNuxtPlugin(() => {
  const { fetchStats, fetchClusters, fetchNewsletters, analyzeAllRunning } = useAppData()
  const toast = useToast()

  let es: EventSource | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let reconnectDelay = 1000

  function connect() {
    es = new EventSource('/api/events')

    es.onopen = () => {
      reconnectDelay = 1000
    }

    es.addEventListener('newsletter:uploaded', () => {
      fetchNewsletters()
    })

    es.addEventListener('newsletter:analyzed', () => {
      fetchNewsletters()
      fetchStats()
    })

    es.addEventListener('clusters:updated', () => {
      fetchClusters()
      fetchStats()
    })

    es.addEventListener('analyze-all:done', (e) => {
      const data = JSON.parse(e.data)
      analyzeAllRunning.value = false
      toast.add({
        title: 'Batch analysis complete',
        description: `${data.analyzed} analyzed, ${data.failed} failed.`,
        color: data.failed ? 'warning' : 'success',
      })
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

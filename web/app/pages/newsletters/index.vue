<script setup lang="ts">
  import { refDebounced, useInfiniteScroll } from '@vueuse/core'
  import type { NewsletterListItem, NewsletterPageResponse } from '#shared/types/newsletter'

  const { analyzeAllRunning } = useAppData()
  const toast = useToast()

  type AnalyzedFilter = 'all' | 'yes' | 'no'
  type SourceFilter = 'all' | 'file' | 'email'
  type SortOrder = 'desc' | 'asc'
  const searchQuery = ref('')
  const filterAnalyzed = ref<AnalyzedFilter>('all')
  const filterType = ref<SourceFilter>('all')
  const sortDate = ref<SortOrder>('desc')
  const debouncedSearchQuery = refDebounced(searchQuery, 300)

  const analyzedOptions = [
    { label: 'Analyzed: All', value: 'all' },
    { label: 'Analyzed: Yes', value: 'yes' },
    { label: 'Analyzed: No', value: 'no' },
  ] as const

  const typeOptions = [
    { label: 'Type: All', value: 'all' },
    { label: 'Type: Fichier', value: 'file' },
    { label: 'Type: Email', value: 'email' },
  ] as const

  const sortOptions = [
    { label: 'Date: Plus récentes', value: 'desc' },
    { label: 'Date: Plus anciennes', value: 'asc' },
  ] as const

  const pageSize = 5
  const scrollArea = useTemplateRef('scrollArea')
  const rows = ref<NewsletterListItem[]>([])
  const totalCount = ref(0)
  const pendingTotal = ref(0)
  const nextOffset = ref<number | null>(0)
  const loadingInitial = ref(false)
  const loadingMore = ref(false)
  const loadError = ref<string | null>(null)
  let requestId = 0

  const hasMore = computed(() => nextOffset.value !== null)
  const resultCount = computed(() => totalCount.value)
  const pendingCount = computed(() => pendingTotal.value)
  const isEmptyState = computed(() => !loadingInitial.value && !loadError.value && rows.value.length === 0)

  const fileInput = ref<HTMLInputElement>()
  const uploading = ref(false)

  function openFileDialog() {
    fileInput.value?.click()
  }

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      await $fetch('/api/newsletters', { method: 'POST', body: formData })
      toast.add({ title: 'Newsletter uploaded', color: 'success' })
      await fetchPage({ reset: true })
    }
    catch (e: any) {
      toast.add({ title: 'Upload failed', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
    }
    finally {
      uploading.value = false
      input.value = ''
    }
  }

  const analyzing = ref<string | null>(null)

  async function triggerAnalysis(id: string) {
    analyzing.value = id
    try {
      await $fetch(`/api/newsletters/${id}/analyze`, { method: 'POST' })
      toast.add({ title: 'Analysis complete', color: 'success' })
      await fetchPage({ reset: true })
    }
    catch (e: any) {
      toast.add({ title: 'Analysis failed', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
    }
    finally {
      analyzing.value = null
    }
  }

  async function triggerAnalyzeAll() {
    analyzeAllRunning.value = true
    try {
      const result = await $fetch('/api/newsletters/analyze-all', { method: 'POST' })
      if (!result.started) {
        toast.add({ title: 'Nothing to analyze', description: 'All newsletters are already analyzed.', color: 'neutral' })
        analyzeAllRunning.value = false
      }
      // If started, loading state clears when analyze-all:done SSE event arrives
    }
    catch (e: any) {
      toast.add({ title: 'Batch analysis failed', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
      analyzeAllRunning.value = false
    }
  }

  async function fetchPage(options: { reset?: boolean } = {}) {
    const reset = options.reset ?? false
    const currentOffset = reset ? 0 : nextOffset.value

    if (!reset && (currentOffset === null || loadingMore.value || loadingInitial.value)) {
      return
    }

    requestId += 1
    const currentRequest = requestId

    if (reset) {
      loadingInitial.value = true
      nextOffset.value = 0
      loadError.value = null
    }
    else {
      loadingMore.value = true
    }

    try {
      const response = await $fetch<NewsletterPageResponse>('/api/newsletters', {
        query: {
          q: debouncedSearchQuery.value || undefined,
          analyzed: filterAnalyzed.value,
          source: filterType.value,
          sort: sortDate.value,
          limit: pageSize,
          offset: currentOffset ?? 0,
        },
      })

      if (currentRequest !== requestId) return

      rows.value = reset ? response.items : [...rows.value, ...response.items]
      totalCount.value = response.total
      pendingTotal.value = response.pendingTotal
      nextOffset.value = response.nextOffset
    }
    catch (e: any) {
      if (currentRequest !== requestId) return
      const message = e?.data?.statusMessage || e?.message || 'Unknown error'
      loadError.value = message
      toast.add({
        title: 'Failed to load newsletters',
        description: message,
        color: 'error',
      })
    }
    finally {
      if (currentRequest === requestId) {
        loadingInitial.value = false
        loadingMore.value = false
      }
    }
  }

  function retryLoad() {
    loadError.value = null
    fetchPage({ reset: rows.value.length === 0 })
  }

  watch([debouncedSearchQuery, filterAnalyzed, filterType, sortDate], () => {
    fetchPage({ reset: true })
  }, { immediate: true })

  watch(analyzeAllRunning, (value, oldValue) => {
    if (oldValue && !value) {
      fetchPage({ reset: true })
    }
  })

  onMounted(() => {
    useInfiniteScroll(
      scrollArea.value?.$el,
      async () => {
        if (!hasMore.value || loadingMore.value || loadingInitial.value || loadError.value) return
        await fetchPage()
      },
      {
        distance: 120,
        canLoadMore: () => {
          return hasMore.value && !loadingMore.value && !loadingInitial.value && !loadError.value
        },
      },
    )
  })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Newsletters">
        <template #right>
          <input ref="fileInput" type="file" accept=".html,.htm,.txt,.eml" class="hidden" @change="handleFileUpload">
          <UButton v-if="pendingCount > 0" icon="i-lucide-sparkles" :label="`Analyze All (${pendingCount})`"
            variant="soft" :loading="analyzeAllRunning" @click="triggerAnalyzeAll" />
          <UButton icon="i-lucide-upload" label="Upload" :loading="uploading" @click="openFileDialog" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
        <div v-if="!isEmptyState" class="flex flex-wrap items-center gap-2">
          <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Search subject or sender..." class="w-64" />
          <USelect v-model="filterAnalyzed" :items="analyzedOptions" value-key="value" label-key="label" class="w-40" />
          <USelect v-model="filterType" :items="typeOptions" value-key="value" label-key="label" class="w-36" />
          <USelect v-model="sortDate" :items="sortOptions" value-key="value" label-key="label" class="w-44" />
          <div class="ms-auto text-xs text-[var(--ui-text-dimmed)]">
            {{ resultCount }} résultat{{ resultCount > 1 ? 's' : '' }}
          </div>
        </div>

        <UCard v-else variant="subtle">
          <div class="py-12 text-center">
            <UIcon name="i-lucide-mail-x" class="mx-auto mb-3 size-10 opacity-50" />
            <p class="font-medium">Aucune newsletter pour le moment</p>
            <p class="mt-1 text-sm text-[var(--ui-text-dimmed)]">
              Importe une premiere newsletter pour lancer l'analyse.
            </p>
            <UFileUpload
              class="mx-auto mt-4 w-full max-w-md min-h-32"
              accept=".html,.htm,.txt,.eml"
              label="Glisse ta newsletter ici"
              description="ou clique pour selectionner un fichier (.html, .txt, .eml)"
              :disabled="uploading"
              @change="handleFileUpload"
            />
          </div>
        </UCard>

        <UScrollArea
          v-if="!isEmptyState"
          ref="scrollArea"
          v-slot="{ item }"
          :items="rows"
          :virtualize="{ estimateSize: 88, gap: 16, lanes:1,}"
          class="p-px"
        >
          <NewsletterRowCard 
              :newsletter="item" 
              :analyzing="analyzing"
              @trigger-analysis="triggerAnalysis"
          />
        </UScrollArea>
    </template>
  </UDashboardPanel>
</template>

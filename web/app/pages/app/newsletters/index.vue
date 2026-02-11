<script setup lang="ts">
  import { refDebounced, useInfiniteScroll, useMediaQuery } from '@vueuse/core'
  import type { NewsletterListItem, NewsletterPageResponse } from '#shared/types/newsletter'

  const { analyzeAllRunning, creditStatus, fetchCreditStatus } = useAppData()
  const toast = useToast()
  await fetchCreditStatus()

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // --- Selection ---
  const { selectedIds, selectionMode, selectedCount, toggle: toggleCheck, selectAll, clearSelection, isSelected } = useNewsletterSelection()
  const selectedId = ref<string | null>(null)

  // --- Filters ---
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
    { label: 'Type: File', value: 'file' },
    { label: 'Type: Email', value: 'email' },
  ] as const

  const sortOptions = [
    { label: 'Date: Newest first', value: 'desc' },
    { label: 'Date: Oldest first', value: 'asc' },
  ] as const

  // --- Pagination ---
  const pageSize = 20
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
  const creditsExhausted = computed(() => (creditStatus.value?.remaining ?? 0) <= 0)
  const creditsLabel = computed(() => {
    if (!creditStatus.value) return 'Credits'
    return `Credits ${creditStatus.value.remaining} left`
  })
  const isEmptyState = computed(() => !loadingInitial.value && !loadError.value && rows.value.length === 0)

  // --- Upload ---
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

  // --- Analyze ---
  const analyzing = ref<string | null>(null)

  async function triggerAnalysis(id: string) {
    if (creditsExhausted.value) {
      toast.add({
        title: 'Monthly credit limit reached',
        description: 'New analyses are blocked until next monthly reset (UTC).',
        color: 'warning',
      })
      return
    }

    analyzing.value = id
    try {
      await $fetch(`/api/newsletters/${id}/analyze`, { method: 'POST' })
      toast.add({ title: 'Analysis complete', color: 'success' })
      await fetchPage({ reset: true })
    }
    catch (e: any) {
      if (e?.statusCode === 402 || e?.data?.data?.code === 'CREDIT_EXHAUSTED') {
        await fetchCreditStatus()
      }
      toast.add({ title: 'Analysis failed', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
    }
    finally {
      analyzing.value = null
    }
  }

  async function triggerAnalyzeAll() {
    if (creditsExhausted.value) {
      toast.add({
        title: 'Monthly credit limit reached',
        description: 'Batch analysis is blocked until next monthly reset (UTC).',
        color: 'warning',
      })
      return
    }

    analyzeAllRunning.value = true
    try {
      const result = await $fetch('/api/newsletters/analyze-all', { method: 'POST' })
      if (!result.started) {
        toast.add({ title: 'Nothing to analyze', description: 'All newsletters are already analyzed.', color: 'neutral' })
        analyzeAllRunning.value = false
      }
    }
    catch (e: any) {
      if (e?.statusCode === 402 || e?.data?.data?.code === 'CREDIT_EXHAUSTED') {
        await fetchCreditStatus()
      }
      toast.add({ title: 'Batch analysis failed', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
      analyzeAllRunning.value = false
    }
  }


  const archiving = ref<boolean>(false)
async function triggerArchive() {
  archiving.value = true
  try {
    await $fetch('/api/newsletters/archive', { method: 'POST', body: { ids: [selectedId.value] } })
    toast.add({ title: 'Newsletter archived', color: 'success' })
    handleArchived()
  }
  catch (e: any) {
    toast.add({ title: 'Archive failed', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
  }
  finally {
    archiving.value = false
  }
}

  // --- Bulk actions ---
  const archivingBulk = ref(false)

  async function archiveSelected() {
    const ids = [...selectedIds.value]
    if (!ids.length) return

    archivingBulk.value = true
    try {
      const result = await $fetch('/api/newsletters/archive', { method: 'POST', body: { ids } })
      toast.add({ title: `${result.archived} newsletter${result.archived !== 1 ? 's' : ''} archived`, color: 'success' })
      clearSelection()
      selectedId.value = null
      await fetchPage({ reset: true })
    }
    catch (e: any) {
      toast.add({ title: 'Archive failed', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
    }
    finally {
      archivingBulk.value = false
    }
  }

  async function analyzeSelected() {
    const ids = [...selectedIds.value]
    for (const id of ids) {
      await triggerAnalysis(id)
    }
    clearSelection()
  }

  // --- Data fetching ---
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

  watch([debouncedSearchQuery, filterAnalyzed, filterType, sortDate], () => {
    fetchPage({ reset: true })
  }, { immediate: true })

  watch(analyzeAllRunning, (value, oldValue) => {
    if (oldValue && !value) {
      fetchPage({ reset: true })
      fetchCreditStatus()
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

  // --- Row interactions ---
  function handleRowSelect(id: string) {
    if (selectionMode.value) {
      toggleCheck(id)
      return
    }
    if (isDesktop.value) {
      selectedId.value = selectedId.value === id ? null : id
    }
    else {
      navigateTo(`/newsletters/${id}`)
    }
  }

  function handleArchived() {
    selectedId.value = null
    fetchPage({ reset: true })
  }

  function handleSelectAll() {
    selectAll(rows.value.map(r => r.id))
  }
</script>

<template>
  <!-- List Panel -->
  <UDashboardPanel id="newsletter-list" :width="440" resizable>
    <template #header>
      <UDashboardNavbar title="Inbox">
        <template #right>
          <UBadge
            v-if="creditStatus"
            :color="creditsExhausted ? 'warning' : 'neutral'"
            variant="subtle"
            icon="i-lucide-wallet"
            class="hidden sm:inline-flex"
          >
            {{ creditsLabel }}
          </UBadge>
          <input ref="fileInput" type="file" accept=".html,.htm,.txt,.eml" class="hidden" @change="handleFileUpload">
          <UButton v-if="pendingCount > 0" icon="i-lucide-sparkles" :label="`Analyze All (${pendingCount})`"
            variant="soft" :loading="analyzeAllRunning" :disabled="creditsExhausted" @click="triggerAnalyzeAll" />
          <UButton icon="i-lucide-upload" label="Upload" :loading="uploading" @click="openFileDialog" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Bulk action bar -->
      <div v-if="selectionMode" class="flex items-center gap-2 mb-3">
        <UBadge color="primary" variant="subtle">{{ selectedCount }} selected</UBadge>
        <UButton
          label="Analyze"
          icon="i-lucide-sparkles"
          size="xs"
          variant="soft"
          :disabled="creditsExhausted"
          @click="analyzeSelected"
        />
        <UButton
          label="Archive"
          icon="i-lucide-archive"
          size="xs"
          variant="soft"
          color="neutral"
          :loading="archivingBulk"
          @click="archiveSelected"
        />
        <UButton
          label="Select All"
          size="xs"
          variant="ghost"
          @click="handleSelectAll"
        />
        <UButton
          label="Cancel"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="clearSelection"
        />
      </div>

      <!-- Filters -->
      <div v-else-if="!isEmptyState" class="flex flex-wrap items-center gap-2">
        <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Search subject or sender..." class="w-64" />
        <USelect v-model="filterAnalyzed" :items="analyzedOptions" value-key="value" label-key="label" class="w-40" />
        <USelect v-model="filterType" :items="typeOptions" value-key="value" label-key="label" class="w-36" />
        <USelect v-model="sortDate" :items="sortOptions" value-key="value" label-key="label" class="w-44" />
        <div class="ms-auto text-xs text-[var(--ui-text-dimmed)]">
          {{ resultCount }} result{{ resultCount !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Empty state -->
      <UCard v-if="isEmptyState" variant="subtle">
        <div class="py-12 text-center">
          <UIcon name="i-lucide-mail-x" class="mx-auto mb-3 size-10 opacity-50" />
          <p class="font-medium">No newsletters yet</p>
          <p class="mt-1 text-sm text-[var(--ui-text-dimmed)]">
            Upload your first newsletter to get started.
          </p>
          <UFileUpload
            class="mx-auto mt-4 w-full max-w-md min-h-32"
            accept=".html,.htm,.txt,.eml"
            label="Drag your newsletter here"
            description="or click to select a file (.html, .txt, .eml)"
            :disabled="uploading"
            @change="handleFileUpload"
          />
        </div>
      </UCard>

      <!-- Newsletter list -->
      <UScrollArea
        v-if="!isEmptyState"
        ref="scrollArea"
        v-slot="{ item }"
        :items="rows"
        :virtualize="{ estimateSize: 88, gap: 16, lanes: 1 }"
        class="p-px"
      >
        <NewsletterRowCard
          :newsletter="item"
          :analyzing="analyzing"
          :credits-exhausted="creditsExhausted"
          :checked="isSelected(item.id)"
          :active="selectedId === item.id"
          :selection-mode="selectionMode"
          @trigger-analysis="triggerAnalysis"
          @select="handleRowSelect"
          @toggle-check="toggleCheck"
        />
      </UScrollArea>
    </template>
  </UDashboardPanel>

  <!-- Detail Panel (desktop only) -->
  <UDashboardPanel grow 
    v-if="isDesktop && selectedId"
    id="newsletter-detail"
  >
    <template #header>
      <UDashboardNavbar v-if="selectedId" :title="rows.find(r => r.id === selectedId)?.subject || 'Newsletter Detail'" >
        <template #right>
            <UButton
              v-if="!rows.find(r => r.id === selectedId)?.analyzed"
              label="Analyze"
              icon="i-lucide-sparkles"
              size="sm"
              :loading="analyzing === selectedId"
              :disabled="creditsExhausted"
              @click="triggerAnalysis(selectedId)"
            />
            <UBadge v-else color="success" variant="subtle" size="sm">Analyzed</UBadge>
            <UButton
              icon="i-lucide-archive"
              size="sm"
              variant="soft"
              color="neutral"
              :loading="archiving === selectedId"
              @click="triggerArchive(selectedId)"
            />
        </template>
        
      </UDashboardNavbar>
    </template>
    <template #body>
      <Suspense v-if="selectedId" :key="selectedId">
        <NewsletterDetailPane
          :newsletter-id="selectedId"
          @archived="handleArchived"
        />
        <template #fallback>
          <div class="flex items-center justify-center h-full">
            <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-[var(--ui-text-dimmed)]" />
          </div>
        </template>
      </Suspense>
      <div v-else class="flex flex-col items-center justify-center h-full text-[var(--ui-text-dimmed)] gap-2">
        <UIcon name="i-lucide-mail-open" class="size-10 opacity-40" />
        <p class="text-sm">Select a newsletter to read</p>
      </div>
    </template>
  </UDashboardPanel>
</template>

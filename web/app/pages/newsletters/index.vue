<script setup lang="ts">
const { newsletters: newsletterList, analyzeAllRunning, fetchNewsletters } = useAppData()
const toast = useToast()

await fetchNewsletters()

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

const pendingCount = computed(() => newsletterList.value?.filter(n => !n.analyzed).length ?? 0)
</script>

<template>
  <div class="h-full overflow-y-auto">
    <UDashboardNavbar title="Newsletters">
      <template #right>
        <input
          ref="fileInput"
          type="file"
          accept=".html,.htm,.txt,.eml"
          class="hidden"
          @change="handleFileUpload"
        >
        <UButton
          v-if="pendingCount > 0"
          icon="i-lucide-sparkles"
          :label="`Analyze All (${pendingCount})`"
          variant="soft"
          :loading="analyzeAllRunning"
          @click="triggerAnalyzeAll"
        />
        <UButton
          icon="i-lucide-upload"
          label="Upload"
          :loading="uploading"
          @click="openFileDialog"
        />
      </template>
    </UDashboardNavbar>

    <div class="p-6">
      <UCard>
        <div class="divide-y divide-[var(--ui-border)]">
          <div
            v-for="nl in newsletterList"
            :key="nl.id"
            class="flex items-center justify-between py-3 px-1 gap-4"
          >
            <div class="flex-1 min-w-0">
              <NuxtLink
                :to="`/newsletters/${nl.id}`"
                class="font-medium text-sm hover:text-[var(--ui-primary)] transition-colors truncate block"
              >
                {{ nl.subject || '(no subject)' }}
              </NuxtLink>
              <div class="flex items-center gap-3 text-xs text-[var(--ui-text-dimmed)] mt-0.5">
                <span v-if="nl.fromName">{{ nl.fromName }}</span>
                <span>{{ new Date(nl.receivedAt).toLocaleDateString() }}</span>
                <UBadge variant="subtle" :color="nl.sourceType === 'mailgun' ? 'info' : 'neutral'" size="xs">
                  {{ nl.sourceType }}
                </UBadge>
              </div>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <span v-if="nl.analyzed" class="text-xs text-[var(--ui-text-dimmed)]">
                {{ nl.problemCount }} problem{{ nl.problemCount !== 1 ? 's' : '' }}
              </span>

              <UBadge v-if="nl.analyzed" color="success" variant="subtle">Analyzed</UBadge>
              <UButton
                v-else
                size="xs"
                label="Analyze"
                :loading="analyzing === nl.id"
                @click="triggerAnalysis(nl.id)"
              />
            </div>
          </div>

          <div v-if="!newsletterList?.length" class="py-12 text-center text-[var(--ui-text-dimmed)]">
            <UIcon name="i-lucide-mail" class="size-10 mx-auto mb-3 opacity-50" />
            <p class="font-medium">No newsletters yet</p>
            <p class="text-sm mt-1">Upload a newsletter file or forward emails via Mailgun.</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

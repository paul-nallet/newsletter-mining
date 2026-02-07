<script setup lang="ts">
const { data: newsletterList, refresh } = await useFetch('/api/newsletters')

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
    await refresh()
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
    await refresh()
  }
  finally {
    analyzing.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Newsletters</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ingested newsletters and their analysis status
        </p>
      </div>
      <div>
        <input
          ref="fileInput"
          type="file"
          accept=".html,.htm,.txt,.eml"
          class="hidden"
          @change="handleFileUpload"
        >
        <UButton
          icon="i-lucide-upload"
          label="Upload"
          :loading="uploading"
          @click="openFileDialog"
        />
      </div>
    </div>

    <!-- Newsletter table -->
    <UCard>
      <div class="divide-y divide-gray-200 dark:divide-gray-800">
        <div
          v-for="nl in newsletterList"
          :key="nl.id"
          class="flex items-center justify-between py-3 px-1 gap-4"
        >
          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="`/newsletters/${nl.id}`"
              class="font-medium text-sm hover:text-primary-500 transition-colors truncate block"
            >
              {{ nl.subject || '(no subject)' }}
            </NuxtLink>
            <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span v-if="nl.fromName">{{ nl.fromName }}</span>
              <span>{{ new Date(nl.receivedAt).toLocaleDateString() }}</span>
              <UBadge variant="subtle" :color="nl.sourceType === 'mailgun' ? 'info' : 'neutral'" size="xs">
                {{ nl.sourceType }}
              </UBadge>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <span v-if="nl.analyzed" class="text-xs text-gray-500">
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

        <div v-if="!newsletterList?.length" class="py-8 text-center text-gray-500 dark:text-gray-400">
          <UIcon name="i-lucide-mail" class="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p class="font-medium">No newsletters yet</p>
          <p class="text-sm mt-1">Upload a newsletter file or forward emails via Mailgun.</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

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

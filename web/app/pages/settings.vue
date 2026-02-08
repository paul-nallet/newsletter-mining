<script setup lang="ts">
const toast = useToast()

const generating = ref(false)
const generateResult = ref<{ success: boolean, totalClusters?: number, totalProblems?: number } | null>(null)
const resetting = ref(false)
const resetModalOpen = ref(false)
const resetConfirmation = ref('')

const resetKeyword = 'RESET DATABASE'
const canResetDatabase = computed(() => resetConfirmation.value.trim() === resetKeyword)

async function regenerateClusters() {
  generating.value = true
  generateResult.value = null
  try {
    const result = await $fetch('/api/clusters/generate', { method: 'POST' })
    generateResult.value = result
    toast.add({
      title: 'Clusters regenerated',
      description: `Created ${result.totalClusters} clusters from ${result.totalProblems} problems.`,
      color: 'success',
    })
  }
  catch (e: any) {
    generateResult.value = { success: false }
    toast.add({
      title: 'Cluster generation failed',
      description: e?.data?.statusMessage || e?.message || 'Unknown error',
      color: 'error',
    })
  }
  finally {
    generating.value = false
  }
}

function openResetModal() {
  resetConfirmation.value = ''
  resetModalOpen.value = true
}

async function resetDatabase() {
  if (!canResetDatabase.value || resetting.value) return

  resetting.value = true
  try {
    const result = await $fetch<{ success: boolean, truncatedTables: number }>('/api/settings/reset-database', {
      method: 'POST',
      body: { confirmation: resetKeyword },
    })

    toast.add({
      title: 'Database reset complete',
      description: `${result.truncatedTables} tables were truncated.`,
      color: 'warning',
    })
    resetModalOpen.value = false
    await navigateTo('/register', { replace: true })
  }
  catch (e: any) {
    toast.add({
      title: 'Database reset failed',
      description: e?.data?.statusMessage || e?.message || 'Unknown error',
      color: 'error',
    })
  }
  finally {
    resetting.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Settings" />
    </template>
    <template #body>

    <div class="space-y-6">
      <!-- Clustering -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Problem Clustering</h2>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-[var(--ui-text-muted)]">
            Regenerate problem clusters from all extracted problems using cosine similarity on embeddings.
            This will delete existing clusters and create new ones, then enrich them with AI-generated summaries.
          </p>

          <div class="flex items-center gap-4">
            <UButton
              label="Regenerate Clusters"
              icon="i-lucide-refresh-cw"
              :loading="generating"
              @click="regenerateClusters"
            />

            <p v-if="generateResult?.success" class="text-sm text-[var(--ui-success)]">
              Created {{ generateResult.totalClusters }} clusters from {{ generateResult.totalProblems }} problems.
            </p>
          </div>
        </div>
      </UCard>

      <!-- Mailgun -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Mailgun Webhook</h2>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-[var(--ui-text-muted)]">
            Configure Mailgun to forward newsletters to this app automatically.
          </p>

          <div class="space-y-3">
            <div>
              <p class="text-xs font-medium text-[var(--ui-text-dimmed)] mb-1">Webhook URL</p>
              <code class="text-sm bg-[var(--ui-bg-elevated)] px-3 py-1.5 rounded block">
                POST https://&lt;your-domain&gt;/api/webhooks/mailgun
              </code>
            </div>

            <div>
              <p class="text-xs font-medium text-[var(--ui-text-dimmed)] mb-1">Setup Steps</p>
              <ol class="text-sm text-[var(--ui-text-muted)] list-decimal list-inside space-y-1">
                <li>Go to Mailgun Dashboard &rarr; Receiving &rarr; Create Route</li>
                <li>Set match expression (e.g. <code class="text-xs bg-[var(--ui-bg-elevated)] px-1 rounded">match_recipient("newsletters@yourdomain.com")</code>)</li>
                <li>Set action: forward to the webhook URL above</li>
                <li>Copy your Webhook Signing Key into <code class="text-xs bg-[var(--ui-bg-elevated)] px-1 rounded">MAILGUN_WEBHOOK_SIGNING_KEY</code> env var</li>
              </ol>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Environment -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Environment Variables</h2>
        </template>

        <div class="space-y-2">
          <p class="text-sm text-[var(--ui-text-muted)]">
            Required environment variables (set in <code class="text-xs bg-[var(--ui-bg-elevated)] px-1 rounded">.env</code>):
          </p>
          <div class="grid gap-2 text-sm font-mono">
            <div v-for="envVar in [
              { name: 'OPENAI_API_KEY', desc: 'GPT-4o analysis + embeddings' },
              { name: 'DATABASE_URL', desc: 'PostgreSQL connection' },
              { name: 'MAILGUN_WEBHOOK_SIGNING_KEY', desc: 'Webhook verification' },
              { name: 'BETTER_AUTH_SECRET', desc: 'Auth signing secret (required)' },
              { name: 'BETTER_AUTH_URL', desc: 'Public auth base URL (recommended in production)' },
            ]" :key="envVar.name" class="flex items-center gap-2">
              <code class="bg-[var(--ui-bg-elevated)] px-2 py-1 rounded text-xs">{{ envVar.name }}</code>
              <span class="text-[var(--ui-text-dimmed)] text-xs font-sans">{{ envVar.desc }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Danger Zone -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-[var(--ui-error)]">Danger Zone</h2>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-[var(--ui-text-muted)]">
            This will permanently delete all data in the public schema, including auth users/sessions,
            newsletters, extracted problems, and clusters.
          </p>

          <UButton
            label="Reset Entire Database"
            icon="i-lucide-trash-2"
            color="error"
            variant="soft"
            @click="openResetModal"
          />
        </div>
      </UCard>
    </div>

    <UModal
      v-model:open="resetModalOpen"
      title="Reset entire database?"
      description="This action is irreversible and will remove all data."
      :close="{ color: 'neutral', variant: 'ghost' }"
      :dismissible="!resetting"
    >
      <template #body>
        <div class="space-y-3">
          <p class="text-sm text-[var(--ui-text-muted)]">
            Type <code class="text-xs bg-[var(--ui-bg-elevated)] px-1 rounded">{{ resetKeyword }}</code> to confirm.
          </p>
          <UInput
            v-model="resetConfirmation"
            :disabled="resetting"
            :placeholder="resetKeyword"
            autocomplete="off"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            :disabled="resetting"
            @click="resetModalOpen = false"
          />
          <UButton
            label="Reset Database"
            color="error"
            icon="i-lucide-alert-triangle"
            :loading="resetting"
            :disabled="!canResetDatabase"
            @click="resetDatabase"
          />
        </div>
      </template>
    </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const toast = useToast()

const generating = ref(false)
const generateResult = ref<{ success: boolean, totalClusters?: number, totalProblems?: number } | null>(null)
const resetting = ref(false)
const resetModalOpen = ref(false)
const resetConfirmation = ref('')

// Subscription
const { data: subscriptions, refresh: refreshSubscriptions } = await useAsyncData('subscriptions', async () => {
  const { data } = await authClient.subscription.list()
  return data ?? []
})

const activeSubscription = computed(() => {
  return subscriptions.value?.find((s: any) => s.status === 'active' || s.status === 'trialing') ?? null
})

const currentPlanName = computed(() => {
  return activeSubscription.value?.plan ?? 'starter'
})

const planLabels: Record<string, string> = {
  starter: 'Starter (Free)',
  growth: 'Growth',
  studio: 'Studio',
}

const planLabel = computed(() => planLabels[currentPlanName.value] ?? currentPlanName.value)

const upgradingTo = ref<string | null>(null)
const schedulingDowngrade = ref(false)
const restoringDowngrade = ref(false)

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDate(value: string | Date | null | undefined): string {
  const parsed = toDate(value)
  if (!parsed) return ''
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

async function upgradePlan(plan: string) {
  upgradingTo.value = plan
  try {
    await authClient.subscription.upgrade({
      plan,
      successUrl: '/app/settings',
      cancelUrl: '/app/settings',
    })
  }
  catch (e: any) {
    toast.add({ title: 'Upgrade failed', description: e?.message || 'Unknown error', color: 'error' })
    upgradingTo.value = null
  }
}

async function openBillingPortal() {
  try {
    await authClient.subscription.billingPortal({
      returnUrl: '/app/settings',
    })
  }
  catch (e: any) {
    toast.add({ title: 'Could not open billing portal', description: e?.message || 'Unknown error', color: 'error' })
  }
}

async function scheduleDowngradeToStarter() {
  if (!activeSubscription.value || schedulingDowngrade.value) return

  schedulingDowngrade.value = true
  try {
    await authClient.subscription.cancel({
      returnUrl: '/app/settings',
    })
  }
  catch (e: any) {
    toast.add({
      title: 'Downgrade request failed',
      description: e?.message || 'Unknown error',
      color: 'error',
    })
  }
  finally {
    schedulingDowngrade.value = false
  }
}

async function restoreDowngrade() {
  if (!activeSubscription.value || restoringDowngrade.value) return

  restoringDowngrade.value = true
  try {
    await authClient.subscription.restore({
      returnUrl: '/app/settings',
    })
    await refreshSubscriptions()
    toast.add({
      title: 'Downgrade canceled',
      description: 'Your subscription will continue as normal.',
      color: 'success',
    })
  }
  catch (e: any) {
    toast.add({
      title: 'Could not restore subscription',
      description: e?.message || 'Unknown error',
      color: 'error',
    })
  }
  finally {
    restoringDowngrade.value = false
  }
}

const resetKeyword = 'RESET DATABASE'
const canResetDatabase = computed(() => resetConfirmation.value.trim() === resetKeyword)

// Ingest email
const { data: ingestData } = useFetch('/api/user/ingest-email')

// Cluster settings
const { data: clusterData } = await useFetch('/api/user/cluster-settings')
const clusterThreshold = ref(0.78)
const clusterMinSize = ref(2)
const autoRecluster = ref(false)
const savingCluster = ref(false)

watch(clusterData, (v) => {
  if (v) {
    clusterThreshold.value = v.clusterThreshold
    clusterMinSize.value = v.clusterMinSize
    autoRecluster.value = v.autoRecluster
  }
}, { immediate: true })

const thresholdLabel = computed(() => {
  const t = clusterThreshold.value
  if (t >= 0.85) return `${t} (very granular — many small clusters)`
  if (t <= 0.6) return `${t} (broad — fewer large clusters)`
  return `${t}`
})

async function saveClusterSettings() {
  savingCluster.value = true
  try {
    await $fetch('/api/user/cluster-settings', {
      method: 'PUT',
      body: {
        clusterThreshold: clusterThreshold.value,
        clusterMinSize: clusterMinSize.value,
        autoRecluster: autoRecluster.value,
      },
    })
    toast.add({ title: 'Cluster settings saved', color: 'success' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to save', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
  }
  finally {
    savingCluster.value = false
  }
}
const ingestEmail = computed(() => ingestData.value?.ingestEmail ?? '')
const copied = ref(false)

async function copyIngestEmail() {
  try {
    await navigator.clipboard.writeText(ingestEmail.value)
    copied.value = true
    toast.add({ title: 'Copied to clipboard', color: 'success' })
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    toast.add({ title: 'Failed to copy', color: 'error' })
  }
}

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
    await $fetch<{ success: boolean }>('/api/settings/reset-database', {
      method: 'POST',
      body: { confirmation: resetKeyword },
    })

    toast.add({
      title: 'Data reset complete',
      description: 'All your newsletters, problems, and clusters have been deleted.',
      color: 'warning',
    })
    resetModalOpen.value = false
    await navigateTo('/app', { replace: true })
  }
  catch (e: any) {
    toast.add({
      title: 'Data reset failed',
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
      <!-- Receive Newsletters -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Receive newsletters</h2>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-[var(--ui-text-muted)]">
            Forward your newsletters to this address. They'll appear in your dashboard automatically.
          </p>

          <div class="flex items-center gap-2">
            <UInput
              :model-value="ingestEmail"
              readonly
              class="flex-1 font-mono"
            />
            <UButton
              :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              :label="copied ? 'Copied' : 'Copy'"
              :color="copied ? 'success' : 'neutral'"
              variant="soft"
              @click="copyIngestEmail"
            />
          </div>
        </div>
      </UCard>

      <!-- Subscription -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Subscription</h2>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium">Current plan</p>
              <p class="text-lg font-semibold">{{ planLabel }}</p>
              <p v-if="activeSubscription?.cancelAtPeriodEnd" class="text-xs text-[var(--ui-warning)]">
                Cancels at end of billing period ({{ formatDate(activeSubscription?.periodEnd) }})
              </p>
              <p v-else-if="activeSubscription?.periodEnd" class="text-xs text-[var(--ui-text-muted)]">
                Current period ends on {{ formatDate(activeSubscription?.periodEnd) }}
              </p>
            </div>
            <UBadge v-if="activeSubscription" :color="activeSubscription.status === 'active' ? 'success' : 'warning'" variant="subtle">
              {{ activeSubscription.status }}
            </UBadge>
            <UBadge v-else color="neutral" variant="subtle">
              Free
            </UBadge>
          </div>

          <div class="flex flex-wrap gap-2">
            <template v-if="activeSubscription">
              <UButton
                label="Manage Billing"
                icon="i-lucide-credit-card"
                variant="soft"
                color="neutral"
                @click="openBillingPortal"
              />
              <UButton
                v-if="activeSubscription.cancelAtPeriodEnd"
                label="Keep current plan"
                icon="i-lucide-rotate-ccw"
                variant="outline"
                color="neutral"
                :loading="restoringDowngrade"
                @click="restoreDowngrade"
              />
              <UButton
                v-else-if="activeSubscription.plan !== 'starter'"
                label="Passer a Starter (fin de periode)"
                icon="i-lucide-arrow-down-circle"
                variant="outline"
                color="warning"
                :loading="schedulingDowngrade"
                @click="scheduleDowngradeToStarter"
              />
            </template>
            <template v-else>
              <UButton
                label="Activer Starter ($0)"
                icon="i-lucide-check-circle"
                variant="soft"
                color="neutral"
                to="/app/upgrade?plan=starter&annual=false"
              />
              <UButton
                label="Upgrade to Growth"
                icon="i-lucide-arrow-up-circle"
                variant="soft"
                :loading="upgradingTo === 'growth'"
                @click="upgradePlan('growth')"
              />
              <UButton
                label="Upgrade to Studio"
                icon="i-lucide-arrow-up-circle"
                variant="outline"
                :loading="upgradingTo === 'studio'"
                @click="upgradePlan('studio')"
              />
            </template>
          </div>
        </div>
      </UCard>

      <!-- Cluster Configuration -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Clustering Configuration</h2>
        </template>

        <div class="space-y-5">
          <!-- Threshold -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">Similarity threshold</label>
              <span class="text-xs text-[var(--ui-text-dimmed)]">{{ thresholdLabel }}</span>
            </div>
              <USlider 
              v-model="clusterThreshold"
              :min="0.5"
              :max="0.95"
              :step="0.01"
              />
            <p class="text-xs text-[var(--ui-text-muted)]">
              Lower values group more loosely related problems. Higher values create tighter, more specific clusters.
            </p>
          </div>

          <!-- Min size -->
          <div class="space-y-2">
            <label class="text-sm font-medium">Minimum cluster size</label>
            <UInput
              v-model.number="clusterMinSize"
              type="number"
              :min="1"
              :max="100"
              class="w-24"
            />
            <p class="text-xs text-[var(--ui-text-muted)]">
              Clusters with fewer mentions than this are hidden from the dashboard.
            </p>
          </div>

          <!-- Auto-recluster -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium">Auto-recluster after analysis</p>
              <p class="text-xs text-[var(--ui-text-muted)]">Automatically regenerate clusters each time a newsletter is analyzed.</p>
            </div>
            <USwitch v-model="autoRecluster" />
          </div>

          <UButton
            label="Save"
            icon="i-lucide-save"
            :loading="savingCluster"
            @click="saveClusterSettings"
          />
        </div>
      </UCard>

      <!-- Regenerate Clustering -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Regenerate Clusters</h2>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-[var(--ui-text-muted)]">
            Delete existing clusters and create new ones from all extracted problems using your current threshold settings.
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

      <!-- Danger Zone -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-[var(--ui-error)]">Danger Zone</h2>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-[var(--ui-text-muted)]">
            This will permanently delete all your newsletters, extracted problems, clusters, and credit history.
            Your account and settings will be kept.
          </p>

          <UButton
            label="Reset My Data"
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
      title="Reset all your data?"
      description="This action is irreversible and will remove all your newsletters, problems, and clusters."
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
            label="Reset My Data"
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

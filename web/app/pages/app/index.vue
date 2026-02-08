<script setup lang="ts">
const { stats, clusters, fetchStats, fetchClusters } = useAppData()
await Promise.all([fetchStats(), fetchClusters()])

const isEmptyState = computed(() => (stats.value?.totalNewsletters ?? 0) === 0 && !clusters.value?.length)

const showWelcome = ref(false)
onMounted(() => {
  if (!localStorage.getItem('nm-welcome-seen')) {
    showWelcome.value = true
  }
})
function dismissWelcome() {
  showWelcome.value = false
  localStorage.setItem('nm-welcome-seen', '1')
}

</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="isEmptyState ? 'Getting Started' : 'Top Problems'">
        <template #right>
          <div v-if="!isEmptyState && stats?.severityBreakdown && Object.keys(stats.severityBreakdown).length" class="flex gap-2">
            <SeverityBadge
              v-for="(count, severity) in stats.severityBreakdown"
              :key="severity"
              :severity="severity"
              :count="count"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Getting Started -->
      <div v-if="isEmptyState" class="flex items-center justify-center min-h-[60vh]">
        <div class="max-w-lg w-full space-y-6">
          <div class="text-center">
            <UIcon name="i-lucide-newspaper" class="size-12 mx-auto mb-4 text-[var(--ui-primary)]" />
            <h2 class="text-xl font-semibold">Welcome to Newsletter Mining</h2>
            <p class="text-sm text-[var(--ui-text-muted)] mt-1">
              Extract problems and opportunities from your newsletters in 3 steps.
            </p>
          </div>

          <HomeGettingStartedStepper />
        </div>
      </div>

      <!-- Normal dashboard -->
      <div v-else class="space-y-6">
        <!-- Stats overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Newsletters Analyzed"
            :value="stats?.totalNewsletters ?? 0"
            icon="i-lucide-mail"
          />
          <StatsCard
            title="Problems Extracted"
            :value="stats?.totalProblems ?? 0"
            icon="i-lucide-alert-triangle"
          />
          <StatsCard
            title="Problem Clusters"
            :value="stats?.totalClusters ?? 0"
            icon="i-lucide-layers"
          />
        </div>

        <!-- Cluster bubble chart -->
        <ClusterBubbleChart v-if="clusters?.length" :clusters="clusters" />

        <!-- Cluster list -->
        <div class="space-y-4">
          <ClusterCard
            v-for="cluster in clusters"
            :key="cluster.id"
            :cluster="cluster"
          />

          <UCard v-if="!clusters?.length" variant="subtle">
            <div class="text-center py-12">
              <UIcon name="i-lucide-layers" class="size-10 mx-auto mb-3 opacity-50" />
              <p class="font-medium">No clusters yet</p>
              <p class="text-sm mt-1">Analyze some newsletters first, then generate clusters.</p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Welcome modal -->
      <UModal v-model:open="showWelcome" title="Welcome to Newsletter Mining" :close="{ color: 'neutral', variant: 'ghost' }">
        <template #body>
          <p class="text-sm text-[var(--ui-text-muted)]">
            This tool helps you extract actionable problems from newsletters.
            Upload newsletters, analyze them with AI, and discover recurring opportunities.
          </p>
        </template>
        <template #footer>
          <div class="flex justify-end w-full">
            <UButton label="Get Started" icon="i-lucide-arrow-right" trailing @click="dismissWelcome" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

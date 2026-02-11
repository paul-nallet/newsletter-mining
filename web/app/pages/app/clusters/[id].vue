<script setup lang="ts">
const route = useRoute()
const { data: cluster } = await useFetch(`/api/clusters/${route.params.id}`)

const mentionLabel = computed(() => {
  const count = cluster.value?.mentionCount ?? 0
  return `${count} mention${count !== 1 ? 's' : ''}`
})

const problemCount = computed(() => cluster.value?.problems?.length ?? 0)

const firstSeenLabel = computed(() =>
  cluster.value?.firstSeen
    ? new Date(cluster.value.firstSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null,
)

const lastSeenLabel = computed(() =>
  cluster.value?.lastSeen
    ? new Date(cluster.value.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null,
)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="cluster?.clusterName ?? 'Cluster'">
        <template #left>
          <UButton
            to="/app"
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            size="sm"
            class="mr-2"
          />
        </template>
        <template #right>
          <TrendBadge v-if="cluster" :trend="cluster.trend" />
          <UBadge variant="subtle" color="neutral">{{ mentionLabel }}</UBadge>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="cluster" class="space-y-6">
        <!-- Summary -->
        <div v-if="cluster.clusterSummary || firstSeenLabel" class="space-y-2">
          <p v-if="cluster.clusterSummary" class="text-sm text-[var(--ui-text-muted)]">
            {{ cluster.clusterSummary }}
          </p>
          <div class="flex gap-4 text-xs text-[var(--ui-text-dimmed)]">
            <span v-if="firstSeenLabel" class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="size-3.5" />
              First seen {{ firstSeenLabel }}
            </span>
            <span v-if="lastSeenLabel" class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-calendar-check" class="size-3.5" />
              Last seen {{ lastSeenLabel }}
            </span>
          </div>
        </div>

        <!-- Problems list -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold">
            All Mentions ({{ problemCount }})
          </h3>

          <ProblemCard
            v-for="problem in cluster.problems"
            :key="problem.id"
            :problem="problem"
          />

          <div v-if="!problemCount" class="text-center py-8 text-[var(--ui-text-dimmed)]">
            <UIcon name="i-lucide-search-x" class="size-8 mx-auto mb-2 opacity-50" />
            <p class="text-sm">No problems in this cluster yet.</p>
          </div>
        </div>
      </div>

      <div v-else class="flex items-center justify-center h-full text-[var(--ui-text-dimmed)]">
        <p>Cluster not found</p>
      </div>
    </template>
  </UDashboardPanel>
</template>

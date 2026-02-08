<script setup lang="ts">
const { stats, clusters, fetchStats, fetchClusters } = useAppData()
await Promise.all([fetchStats(), fetchClusters()])
</script>

<template>
  <UDashboardPanel>

    <template #header>
      <UDashboardNavbar title="Top Problems">
        <template #right>
          <div v-if="stats?.severityBreakdown && Object.keys(stats.severityBreakdown).length" class="flex gap-2">
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
      <div class=" space-y-6">
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
            <div class="text-center py-12 ">
              <UIcon name="i-lucide-layers" class="size-10 mx-auto mb-3 opacity-50" />
              <p class="font-medium">No clusters yet</p>
              <p class="text-sm mt-1">Analyze some newsletters first, then generate clusters.</p>
            </div>
          </UCard>
        </div>
      </div>
    </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
const { data: stats } = await useFetch('/api/stats')
const { data: clusters } = await useFetch('/api/clusters')
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold">Top Problems</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Problem clusters ranked by mention count
      </p>
    </div>

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

    <!-- Severity breakdown -->
    <div v-if="stats?.severityBreakdown && Object.keys(stats.severityBreakdown).length" class="flex gap-3">
      <SeverityBadge
        v-for="(count, severity) in stats.severityBreakdown"
        :key="severity as string"
        :severity="severity as string"
        :count="count as number"
      />
    </div>

    <!-- Cluster list (ranked by mention_count) -->
    <div class="space-y-4">
      <ClusterCard
        v-for="cluster in clusters"
        :key="cluster.id"
        :cluster="cluster"
      />

      <UCard v-if="!clusters?.length" variant="subtle">
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <UIcon name="i-lucide-layers" class="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p class="font-medium">No clusters yet</p>
          <p class="text-sm mt-1">Analyze some newsletters first, then generate clusters.</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

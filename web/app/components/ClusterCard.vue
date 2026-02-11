<script setup lang="ts">
defineProps<{
  cluster: {
    id: string
    clusterName: string
    clusterSummary?: string
    mentionCount: number
    trend: string
    firstSeen?: string
    lastSeen?: string
    problemIds?: string[]
  }
}>()
</script>

<template>
  <UCard>
    <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <NuxtLink
            :to="`/app/clusters/${cluster.id}`"
            class="font-semibold hover:text-primary-500 transition-colors"
          >
            {{ cluster.clusterName }}
          </NuxtLink>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <TrendBadge :trend="cluster.trend" />
          <UBadge variant="subtle" color="neutral">
            {{ cluster.mentionCount }} mention{{ cluster.mentionCount !== 1 ? 's' : '' }}
          </UBadge>
        </div>
      </div>

      <!-- Summary -->
      <p v-if="cluster.clusterSummary" class="text-sm text-gray-600 dark:text-gray-300">
        {{ cluster.clusterSummary }}
      </p>

      <!-- Metadata -->
      <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span v-if="cluster.firstSeen">First seen: {{ new Date(cluster.firstSeen).toLocaleDateString() }}</span>
        <span v-if="cluster.lastSeen">Last seen: {{ new Date(cluster.lastSeen).toLocaleDateString() }}</span>
        <span>{{ cluster.problemIds?.length || 0 }} source{{ (cluster.problemIds?.length || 0) !== 1 ? 's' : '' }}</span>
      </div>
    </div>
  </UCard>
</template>

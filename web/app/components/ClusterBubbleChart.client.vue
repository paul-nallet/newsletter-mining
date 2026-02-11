<script setup lang="ts">
interface Cluster {
  id: string
  clusterName: string
  clusterSummary?: string
  mentionCount: number
  trend: string
  firstSeen?: string
  lastSeen?: string
  problemIds?: string[]
}

const props = defineProps<{
  clusters: Cluster[]
}>()

const trendConfig: Record<string, { label: string; color: string; bar: string }> = {
  emerging: { label: 'Emerging', color: 'text-green-500', bar: 'bg-green-500' },
  stable: { label: 'Stable', color: 'text-[var(--ui-text-dimmed)]', bar: 'bg-[var(--ui-text-dimmed)]' },
  declining: { label: 'Declining', color: 'text-red-500', bar: 'bg-red-500' },
}

const sorted = computed(() =>
  [...props.clusters]
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 10),
)

const maxMentions = computed(() =>
  Math.max(...sorted.value.map(c => c.mentionCount), 1),
)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-sm">Top Clusters</h3>
        <div class="flex items-center gap-3 text-xs text-[var(--ui-text-dimmed)]">
          <span class="flex items-center gap-1">
            <span class="inline-block size-2 rounded-full bg-green-500" /> emerging
          </span>
          <span class="flex items-center gap-1">
            <span class="inline-block size-2 rounded-full bg-[var(--ui-text-dimmed)]" /> stable
          </span>
          <span class="flex items-center gap-1">
            <span class="inline-block size-2 rounded-full bg-red-500" /> declining
          </span>
        </div>
      </div>
    </template>

    <div v-if="sorted.length" class="space-y-3">
      <NuxtLink
        v-for="cluster in sorted"
        :key="cluster.id"
        :to="`/app/clusters/${cluster.id}`"
        class="group flex items-center gap-3"
      >
        <!-- Label -->
        <div class="w-40 shrink-0 text-right">
          <p class="text-sm truncate group-hover:underline underline-offset-2">
            {{ cluster.clusterName }}
          </p>
        </div>

        <!-- Bar -->
        <div class="flex-1 flex items-center gap-2">
          <div class="flex-1 h-6 rounded bg-[var(--ui-bg-elevated)] overflow-hidden">
            <div
              class="h-full rounded transition-all"
              :class="trendConfig[cluster.trend]?.bar ?? trendConfig.stable.bar"
              :style="{ width: `${(cluster.mentionCount / maxMentions) * 100}%`, opacity: 0.7 }"
            />
          </div>
          <span class="w-8 text-xs tabular-nums text-right" :class="trendConfig[cluster.trend]?.color">
            {{ cluster.mentionCount }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-8 text-[var(--ui-text-dimmed)]">
      <p class="text-sm">Not enough data to display the chart.</p>
    </div>
  </UCard>
</template>

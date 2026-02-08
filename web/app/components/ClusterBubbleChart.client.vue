<script setup lang="ts">
import { VisXYContainer, VisScatter, VisAxis, VisTooltip } from '@unovis/vue'
import { Scale, Scatter } from '@unovis/ts'

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

const trendColors: Record<string, string> = {
  emerging: '#22c55e',
  stable: '#6b7280',
  declining: '#ef4444',
}

interface BubblePoint {
  id: string
  name: string
  summary: string
  x: number
  y: number
  size: number
  color: string
  trend: string
  mentionCount: number
}

const data = computed<BubblePoint[]>(() =>
  props.clusters.map(c => ({
    id: c.id,
    name: c.clusterName,
    summary: c.clusterSummary ?? '',
    x: c.firstSeen ? new Date(c.firstSeen).getTime() : Date.now(),
    y: c.mentionCount,
    size: c.problemIds?.length ?? c.mentionCount,
    color: trendColors[c.trend] ?? trendColors.stable,
    trend: c.trend,
    mentionCount: c.mentionCount,
  })),
)

const x = (d: BubblePoint) => d.x
const y = (d: BubblePoint) => d.y
const size = (d: BubblePoint) => d.size
const color = (d: BubblePoint) => d.color
const label = (d: BubblePoint) => d.name

const xScale = Scale.scaleTime()

const tickFormat = (ts: number) => {
  const date = new Date(ts)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const triggers = {
  [Scatter.selectors.point]: (d: BubblePoint) => `
    <div style="max-width:260px;font-size:13px;line-height:1.4">
      <div style="font-weight:600;margin-bottom:4px">${d.name}</div>
      <div style="color:#9ca3af;margin-bottom:6px">${d.summary}</div>
      <div style="display:flex;gap:8px;font-size:12px">
        <span>${d.mentionCount} mention${d.mentionCount !== 1 ? 's' : ''}</span>
        <span style="color:${d.color}">${d.trend}</span>
      </div>
    </div>
  `,
}

</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-sm">Cluster Map</h3>
        <div class="flex items-center gap-3 text-xs text-[var(--ui-text-dimmed)]">
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-green-500" /> emerging
          </span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-gray-500" /> stable
          </span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-red-500" /> declining
          </span>
        </div>
      </div>
    </template>

    <div v-if="data.length" class="h-[350px]">
      <VisXYContainer :data="data" :xScale="xScale" :yDomainMinConstraint="[0, undefined]">
        <VisScatter
          :x="x"
          :y="y"
          :size="size"
          :sizeRange="[20, 60]"
          :color="color"
          :label="label"
          :labelPosition="'bottom'"
          :labelHideOverlapping="true"
          cursor="default"
        />
        <VisAxis type="x" :tickFormat="tickFormat" :gridLine="false" />
        <VisAxis type="y" label="Mentions" :gridLine="true" />
        <VisTooltip :triggers="triggers" />
      </VisXYContainer>
    </div>

    <div v-else class="text-center py-8 text-[var(--ui-text-dimmed)]">
      <p class="text-sm">Not enough data to display the chart.</p>
    </div>
  </UCard>
</template>

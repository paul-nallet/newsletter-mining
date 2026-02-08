<script setup lang="ts">
const props = defineProps<{
  trend: string
}>()

const config: Record<string, { icon: string, color: string, label: string }> = {
  emerging: { icon: 'i-lucide-trending-up', color: 'success', label: 'Emerging' },
  stable: { icon: 'i-lucide-minus', color: 'neutral', label: 'Stable' },
  declining: { icon: 'i-lucide-trending-down', color: 'error', label: 'Declining' },
}

const current = computed(() => config[props.trend] || config.stable)
</script>

<template>
  <UBadge :color="current.color as any" variant="subtle">
    <UIcon :name="current.icon" class="w-3 h-3 mr-1" />
    {{ current.label }}
  </UBadge>
</template>

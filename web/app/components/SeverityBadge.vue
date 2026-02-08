<script setup lang="ts">
const props = defineProps<{
  severity: string
  count?: number
}>()

const colorMap: Record<string, string> = {
  high: 'error',
  medium: 'warning',
  low: 'neutral',
}

const color = computed(() => (colorMap[props.severity] || 'neutral') as any)
</script>

<template>
  <UBadge :color="color" variant="subtle" class="capitalize">
    {{ severity }}
    <span v-if="count !== undefined" class="ml-1 font-bold">{{ count }}</span>
  </UBadge>
</template>

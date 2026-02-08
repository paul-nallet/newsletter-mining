<script setup lang="ts">
defineProps<{
  title: string
  value: number | string
  icon: string
}>()
</script>

<template>
  <UCard>
    <div class="flex items-center gap-4">
      <div class="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
        <UIcon :name="icon" class="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </div>
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ title }}</p>
        <p class="text-2xl font-bold">{{ value }}</p>
      </div>
    </div>
  </UCard>
</template>

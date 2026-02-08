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
      <div class="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 aspect-square">
        <UIcon :name="icon" class="text-gray-600 dark:text-gray-400 size-5" 
        />
      </div>
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ title }}</p>
        <p class="text-2xl font-bold">{{ value }}</p>
      </div>
    </div>
  </UCard>
</template>

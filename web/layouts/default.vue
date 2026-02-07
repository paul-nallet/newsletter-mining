<script setup lang="ts">
const navigation = [
  { label: 'Top Problems', to: '/', icon: 'i-lucide-flame' },
  { label: 'Newsletters', to: '/newsletters', icon: 'i-lucide-mail' },
  { label: 'Settings', to: '/settings', icon: 'i-lucide-settings' },
]

const route = useRoute()
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
      <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 class="text-lg font-bold">Newsletter Mining</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">Opportunity Discovery</p>
      </div>

      <nav class="flex-1 p-2 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="[
            route.path === item.to
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          ]"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="flex-1 bg-gray-50 dark:bg-gray-950">
      <div class="max-w-6xl mx-auto p-8">
        <slot />
      </div>
    </main>
  </div>
</template>

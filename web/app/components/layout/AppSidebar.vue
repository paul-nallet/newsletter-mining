<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

interface Props {
  currentUserEmail?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  logout: []
}>()

const toast = useToast()
const route = useRoute()

function isRouteActive(path: string) {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/clusters')
  }
  if (path === '/newsletters') {
    return route.path.startsWith('/newsletters')
  }
  if (path === '/settings') {
    return route.path.startsWith('/settings')
  }
  return route.path === path
}

const mainItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Top Problems',
    icon: 'i-lucide-flame',
    to: '/',
    active: isRouteActive('/'),
  },
  {
    label: 'Newsletters',
    icon: 'i-lucide-mail',
    to: '/newsletters',
    active: isRouteActive('/newsletters'),
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/settings',
    active: isRouteActive('/settings'),
  },
])

const secondaryItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Feedback',
    icon: 'i-lucide-message-circle',
    to: 'https://github.com/nuxt-ui-templates/dashboard',
    target: '_blank',
  },
  {
    label: 'Help & Support',
    icon: 'i-lucide-circle-help',
    to: 'https://github.com/nuxt/ui',
    target: '_blank',
  },
])

const userInitials = computed(() => {
  const value = props.currentUserEmail?.trim()
  if (!value) return 'NM'
  return value.slice(0, 2).toUpperCase()
})

const profileItems = computed(() => [[
  {
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    color: 'error' as const,
    onSelect: () => emit('logout'),
  },
]])

function handleSearchClick() {
  toast.add({
    title: 'Search',
    description: 'Command search is not enabled yet in this MVP.',
  })
}
</script>

<template>
  <UDashboardSidebar collapsible resizable>
    <template #header="{ collapsed }">
      <div
        class="flex items-center"
        :class="collapsed ? 'justify-center' : 'justify-between'"
      >
        <div v-if="!collapsed" class="min-w-0">
          <p class="text-sm font-semibold truncate">Newsletter Mining</p>
          <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            Opportunity Discovery
          </p>
        </div>
        <UIcon v-else name="i-lucide-newspaper" class="size-5 text-primary" />
      </div>
    </template>

    <template #default="{ collapsed }">
      <UButton
        :label="collapsed ? undefined : 'Search...'"
        icon="i-lucide-search"
        color="neutral"
        variant="outline"
        :block="!collapsed"
        :square="collapsed"
        @click="handleSearchClick"
      >
        <template v-if="!collapsed" #trailing>
          <div class="flex items-center gap-0.5 ms-auto">
            <UKbd value="meta" variant="subtle" />
            <UKbd value="K" variant="subtle" />
          </div>
        </template>
      </UButton>

      <UNavigationMenu
        :collapsed="collapsed"
        :items="mainItems"
        orientation="vertical"
        highlight
      />

      <UNavigationMenu
        :collapsed="collapsed"
        :items="secondaryItems"
        orientation="vertical"
        class="mt-auto"
      />
    </template>

    <template #footer="{ collapsed }">
      <UDropdownMenu :items="profileItems" :content="{ side: collapsed ? 'right' : 'top', align: 'start' }">
        <UButton
          color="neutral"
          variant="ghost"
          :block="!collapsed"
          :square="collapsed"
          class="w-full"
        >
          <template #leading>
            <UAvatar :text="userInitials" size="sm" />
          </template>

          <span v-if="!collapsed" class="truncate text-xs text-gray-600 dark:text-gray-300">
            {{ currentUserEmail || 'Signed in' }}
          </span>
        </UButton>
      </UDropdownMenu>
    </template>
  </UDashboardSidebar>
</template>

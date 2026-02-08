<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { CreditStatus } from '#shared/types/credits'

interface Props {
  currentUserEmail?: string | null
  creditStatus?: CreditStatus | null
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
    to: 'mailto:?subject=Newsletter%20Mining%20Feedback',
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

const creditLimit = computed(() => Math.max(Number(props.creditStatus?.limit ?? 50), 1))

const remainingCredits = computed(() => {
  if (!props.creditStatus) return creditLimit.value
  return Math.max(Number(props.creditStatus.remaining ?? 0), 0)
})

const creditCounterLabel = computed(() => `${remainingCredits.value} left`)

const creditProgressColor = computed(() => {
  if (!props.creditStatus) return 'neutral'
  return props.creditStatus.exhausted ? 'warning' : 'primary'
})

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
      <div class="w-full px-1">
        <UDropdownMenu
          :items="profileItems"
          :content="{ side: collapsed ? 'right' : 'top', align: 'start', sideOffset: 8 }"
          :ui="{ content: 'min-w-64' }"
        >
          <template #content-top>
            <div class="px-2 pt-2 pb-1">
              <p v-if="currentUserEmail" class="mb-2 px-1 text-xs font-medium text-[var(--ui-text-toned)]">
                {{ currentUserEmail }}
              </p>

              <div class="rounded-md border border-[var(--ui-border)] p-2">
                <div class="mb-1.5 flex items-center justify-between text-sm">
                  <span class="inline-flex items-center gap-1.5 font-medium">
                    <UIcon name="i-lucide-coins" class="size-4" />
                    Credits
                  </span>
                  <span class="font-semibold tabular-nums">{{ creditCounterLabel }}</span>
                </div>

                <UProgress
                  :model-value="remainingCredits"
                  :max="creditLimit"
                  size="xs"
                  :color="creditProgressColor"
                  :ui="{ root: 'rounded-full' }"
                />
              </div>
            </div>
          </template>

          <UButton
            color="neutral"
            variant="ghost"
            :block="!collapsed"
            :square="collapsed"
            class="w-full"
            :avatar="
            {
              text: userInitials,
              size: 'sm',
            }
            "
          >
            
            <span v-if="!collapsed" class="truncate text-xs text-gray-600 dark:text-gray-300">
              {{ currentUserEmail || 'Signed in' }}
            </span>
          </UButton>
        </UDropdownMenu>
      </div>
    </template>
  </UDashboardSidebar>
</template>

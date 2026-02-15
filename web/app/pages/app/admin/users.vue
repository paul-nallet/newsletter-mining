<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface AdminUser {
  id: string
  email: string
  currentPlan: string
  creditsCount: number
  newslettersCount: number
  problemsCount: number
}

interface AdminUsersResponse {
  users: AdminUser[]
}

const { session } = useAuthSession()

if (!session.value.isAdmin) {
  await navigateTo('/app')
}

const { data, pending, error, refresh } = await useFetch<AdminUsersResponse>('/api/admin/users', {
  key: 'admin-users',
})

const users = computed(() => data.value?.users ?? [])

const errorMessage = computed(() => {
  const value = error.value as any
  return value?.data?.statusMessage || value?.message || 'Unable to load users.'
})

const columns: TableColumn<AdminUser>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    meta: {
      class: {
        td: 'font-mono text-xs',
      },
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'creditsCount',
    header: 'Credits',
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right font-medium tabular-nums',
      },
    },
  },
  {
    accessorKey: 'currentPlan',
    header: 'Plan',
    meta: {
      class: {
        td: 'capitalize',
      },
    },
  },
  {
    accessorKey: 'newslettersCount',
    header: 'Newsletters',
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right tabular-nums',
      },
    },
  },
  {
    accessorKey: 'problemsCount',
    header: 'Problems',
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right tabular-nums',
      },
    },
  },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Admin · Users">
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            :loading="pending"
            @click="refresh()"
          >
            Refresh
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-shield-alert"
          title="Access denied or unavailable"
          :description="errorMessage"
        />

        <UCard v-else-if="pending" variant="subtle">
          <div class="py-8 text-sm text-[var(--ui-text-muted)]">
            Loading users...
          </div>
        </UCard>

        <template v-else>
          <UCard v-if="!users.length" variant="subtle">
            <div class="py-8 text-sm text-[var(--ui-text-muted)]">
              No users found.
            </div>
          </UCard>

          <UCard v-else class="overflow-hidden">
            <UTable
              :data="users"
              :columns="columns"
              class="w-full"
            />
          </UCard>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
interface AdminUser {
  id: string
  email: string
  name: string
  createdAt: string | Date
  ingestEmail: string | null
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

function formatDate(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}
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

          <UCard v-for="item in users" :key="item.id">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div class="space-y-1">
                <p class="font-medium">{{ item.name || 'Unnamed user' }}</p>
                <p class="text-sm text-[var(--ui-text-muted)]">{{ item.email }}</p>
                <p class="text-xs text-[var(--ui-text-muted)]">Created {{ formatDate(item.createdAt) }}</p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <UBadge color="neutral" variant="subtle">
                  {{ item.newslettersCount }} newsletters
                </UBadge>
                <UBadge color="neutral" variant="subtle">
                  {{ item.problemsCount }} problems
                </UBadge>
                <UBadge
                  v-if="item.ingestEmail"
                  color="primary"
                  variant="soft"
                  class="max-w-[280px] truncate"
                >
                  {{ item.ingestEmail }}
                </UBadge>
              </div>
            </div>
          </UCard>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>

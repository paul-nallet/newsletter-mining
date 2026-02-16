<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface AdminUser {
  id: string
  email: string
  currentPlan: string
  currentPlanLabel?: string
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

const testEmailTo = ref('')
const testEmailSending = ref(false)
const testEmailResult = ref<{ ok: boolean, to?: string, error?: string } | null>(null)

async function sendTestEmail() {
  testEmailSending.value = true
  testEmailResult.value = null
  try {
    const res = await $fetch<{ ok: boolean, to: string }>('/api/admin/test-email', {
      method: 'POST',
      body: { to: testEmailTo.value || undefined },
    })
    testEmailResult.value = { ok: true, to: res.to }
  }
  catch (err: any) {
    testEmailResult.value = { ok: false, error: err?.data?.statusMessage || err?.message || 'Failed to send' }
  }
  finally {
    testEmailSending.value = false
  }
}

const planLabels: Record<string, string> = {
  starter: 'Mini',
  growth: 'Growth',
  studio: 'Studio',
}

const users = computed(() => {
  return (data.value?.users ?? []).map((user) => ({
    ...user,
    currentPlanLabel: planLabels[user.currentPlan] ?? user.currentPlan,
  }))
})

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
    accessorKey: 'currentPlanLabel',
    header: 'Plan',
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
        <UCard>
          <div class="flex flex-wrap items-end gap-3">
            <UFormField label="Test email config" class="flex-1">
              <UInput
                v-model="testEmailTo"
                :placeholder="session.user?.email || 'recipient@example.com'"
                type="email"
                class="w-full"
              />
            </UFormField>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-send"
              :loading="testEmailSending"
              @click="sendTestEmail"
            >
              Send test email
            </UButton>
          </div>
          <UAlert
            v-if="testEmailResult?.ok"
            color="success"
            variant="subtle"
            icon="i-lucide-check"
            :title="`Test email sent to ${testEmailResult.to}`"
            class="mt-3"
          />
          <UAlert
            v-else-if="testEmailResult && !testEmailResult.ok"
            color="error"
            variant="subtle"
            icon="i-lucide-x"
            title="Failed to send test email"
            :description="testEmailResult.error"
            class="mt-3"
          />
        </UCard>

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

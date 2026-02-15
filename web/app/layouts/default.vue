<script setup lang="ts">
  import AppSidebar from '~/components/layout/AppSidebar.vue'
  import { authClient } from '~/lib/auth-client'

  const { creditStatus, fetchCreditStatus } = useAppData()
  const { session } = useAuthSession()
  const currentUser = computed(() => session.value.user)
  await fetchCreditStatus()

  async function logout() {
    await authClient.signOut()
    useAuthSession().clear()
    await navigateTo('/login')
  }
</script>

<template>
  <UDashboardGroup>
    <AppSidebar
      :current-user-email="currentUser?.email"
      :is-admin="session?.isAdmin"
      :credit-status="creditStatus"
      @logout="logout"
    />

    <slot />
  </UDashboardGroup>
</template>

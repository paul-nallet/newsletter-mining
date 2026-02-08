<script setup lang="ts">
import AppSidebar from '~/components/layout/AppSidebar.vue'
import { authClient } from '~/lib/auth-client'

const { session } = useAuthSession()
const currentUser = computed(() => session.value.user)

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
      @logout="logout"
    />

    <UDashboardPanel>
      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>

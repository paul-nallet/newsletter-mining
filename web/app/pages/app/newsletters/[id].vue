<script setup lang="ts">
const route = useRoute()
const newsletterId = computed(() => route.params.id as string)

function handleArchived() {
  navigateTo('/newsletters')
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/newsletters"
            size="sm"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <Suspense>
        <NewsletterDetailPane
          :newsletter-id="newsletterId"
          @archived="handleArchived"
        />
        <template #fallback>
          <div class="flex items-center justify-center h-full">
            <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-[var(--ui-text-dimmed)]" />
          </div>
        </template>
      </Suspense>
    </template>
  </UDashboardPanel>
</template>

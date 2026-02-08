<script setup lang="ts">
const route = useRoute()
const { data: newsletter, refresh } = await useFetch(`/api/newsletters/${route.params.id}`)

const analyzing = ref(false)

async function triggerAnalysis() {
  analyzing.value = true
  try {
    await $fetch(`/api/newsletters/${route.params.id}/analyze`, { method: 'POST' })
    await refresh()
  }
  finally {
    analyzing.value = false
  }
}
</script>

<template>
  <div v-if="newsletter" class="h-full overflow-y-auto">
    <UDashboardNavbar :title="newsletter.subject || '(no subject)'">
      <template #left>
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/newsletters"
          size="sm"
        />
      </template>
      <template #right>
        <UButton
          v-if="!newsletter.analyzed"
          label="Analyze"
          icon="i-lucide-sparkles"
          :loading="analyzing"
          @click="triggerAnalysis"
        />
        <UBadge v-else color="success" variant="subtle" size="lg">Analyzed</UBadge>
      </template>
    </UDashboardNavbar>

    <div class="p-6 space-y-6">
      <!-- Metadata -->
      <div class="flex items-center gap-3 text-sm text-[var(--ui-text-dimmed)]">
        <span v-if="newsletter.fromName || newsletter.fromEmail">
          {{ newsletter.fromName || newsletter.fromEmail }}
        </span>
        <span>{{ new Date(newsletter.receivedAt).toLocaleDateString() }}</span>
        <UBadge variant="subtle" :color="newsletter.sourceType === 'mailgun' ? 'info' : 'neutral'" size="xs">
          {{ newsletter.sourceType }}
        </UBadge>
      </div>

      <!-- Analysis results -->
      <div v-if="newsletter.analyzed" class="space-y-4">
        <div v-if="newsletter.overallSentiment || newsletter.keyTopics?.length" class="flex items-center gap-2 flex-wrap">
          <UBadge v-if="newsletter.overallSentiment" variant="subtle" color="neutral">
            {{ newsletter.overallSentiment }}
          </UBadge>
          <UBadge
            v-for="topic in newsletter.keyTopics"
            :key="topic"
            variant="subtle"
            color="neutral"
          >
            {{ topic }}
          </UBadge>
        </div>

        <h2 class="font-semibold">
          Extracted Problems ({{ newsletter.problems?.length || 0 }})
        </h2>
        <div class="space-y-3">
          <ProblemCard
            v-for="problem in newsletter.problems"
            :key="problem.id"
            :problem="problem"
          />
        </div>
      </div>

      <!-- Newsletter content -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-sm">Newsletter Content</h2>
        </template>
        <pre class="whitespace-pre-wrap text-sm text-[var(--ui-text-muted)] max-h-96 overflow-y-auto">{{ newsletter.textBody }}</pre>
      </UCard>
    </div>
  </div>
</template>

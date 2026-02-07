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
  <div v-if="newsletter" class="space-y-6">
    <!-- Header -->
    <div>
      <NuxtLink to="/newsletters" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2 inline-flex items-center gap-1">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        Back to Newsletters
      </NuxtLink>

      <div class="flex items-start justify-between gap-4 mt-2">
        <div>
          <h1 class="text-2xl font-bold">{{ newsletter.subject || '(no subject)' }}</h1>
          <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span v-if="newsletter.fromName || newsletter.fromEmail">
              {{ newsletter.fromName || newsletter.fromEmail }}
            </span>
            <span>{{ new Date(newsletter.receivedAt).toLocaleDateString() }}</span>
            <UBadge variant="subtle" :color="newsletter.sourceType === 'mailgun' ? 'info' : 'neutral'" size="xs">
              {{ newsletter.sourceType }}
            </UBadge>
          </div>
        </div>

        <UButton
          v-if="!newsletter.analyzed"
          label="Analyze"
          icon="i-lucide-sparkles"
          :loading="analyzing"
          @click="triggerAnalysis"
        />
        <UBadge v-else color="success" variant="subtle" size="lg">Analyzed</UBadge>
      </div>
    </div>

    <!-- Analysis results -->
    <div v-if="newsletter.analyzed" class="space-y-4">
      <div v-if="newsletter.overallSentiment || newsletter.keyTopics?.length" class="flex items-center gap-3">
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
      <pre class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto">{{ newsletter.textBody }}</pre>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { NewsletterDetail } from '#shared/types/newsletter'

const props = defineProps<{
  newsletterId: string
}>()

const emit = defineEmits<{
  (e: 'archived'): void
}>()

const toast = useToast()
const { creditStatus, fetchCreditStatus } = useAppData()

const { data: newsletter, refresh } = await useFetch<NewsletterDetail>(() => `/api/newsletters/${props.newsletterId}`, {
  watch: [() => props.newsletterId],
})
await fetchCreditStatus()

const analyzing = ref(false)
const archiving = ref(false)
const creditsExhausted = computed(() => (creditStatus.value?.remaining ?? 0) <= 0)

async function triggerAnalysis() {
  if (creditsExhausted.value) {
    toast.add({
      title: 'Monthly credit limit reached',
      description: 'New analyses are blocked until next monthly reset (UTC).',
      color: 'warning',
    })
    return
  }

  analyzing.value = true
  try {
    await $fetch(`/api/newsletters/${props.newsletterId}/analyze`, { method: 'POST' })
    await refresh()
    await fetchCreditStatus()
    toast.add({ title: 'Analysis complete', color: 'success' })
  }
  catch (e: any) {
    if (e?.statusCode === 402 || e?.data?.data?.code === 'CREDIT_EXHAUSTED') {
      await fetchCreditStatus()
    }
    toast.add({ title: 'Analysis failed', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
  }
  finally {
    analyzing.value = false
  }
}

async function triggerArchive() {
  archiving.value = true
  try {
    await $fetch('/api/newsletters/archive', { method: 'POST', body: { ids: [props.newsletterId] } })
    toast.add({ title: 'Newsletter archived', color: 'success' })
    emit('archived')
  }
  catch (e: any) {
    toast.add({ title: 'Archive failed', description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error' })
  }
  finally {
    archiving.value = false
  }
}
</script>

<template>
  <div v-if="newsletter" class="flex flex-col h-full">

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
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

        <h3 class="font-semibold text-sm">
          Extracted Problems ({{ newsletter.problems?.length || 0 }})
        </h3>
        <div class="space-y-3">
          <ProblemCard
            v-for="problem in newsletter.problems"
            :key="problem.id"
            :problem="problem"
          />
        </div>
      </div>

      <!-- Newsletter content -->
      <div>
        <h3 class="font-semibold text-sm mb-3">Newsletter Content</h3>
        <MDC
          v-if="newsletter.markdownBody"
          :value="newsletter.markdownBody"
          tag="article"
          class="text-sm leading-6 whitespace-normal [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline [&_a]:underline-offset-2"
        />
        <p v-else class="text-sm text-[var(--ui-text-muted)]">No newsletter content available.</p>
      </div>
    </div>
  </div>

  <div v-else class="flex items-center justify-center h-full text-[var(--ui-text-dimmed)]">
    <p>Newsletter not found</p>
  </div>
</template>

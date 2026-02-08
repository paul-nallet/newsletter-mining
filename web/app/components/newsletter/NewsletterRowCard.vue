<script setup lang="ts">
import type { NewsletterListItem } from '#shared/types/newsletter'

const props = defineProps<{
  newsletter: NewsletterListItem
  analyzing: string | null
}>()
const { newsletter, analyzing } = toRefs(props)

const emit = defineEmits<{
  (e: 'trigger-analysis', id: string): void
}>()

const subjectLabel = computed(() => props.newsletter.subject?.trim() || '(no subject)')
const senderLabel = computed(() => props.newsletter.fromName?.trim() || props.newsletter.fromEmail?.trim() || 'Unknown sender')
const receivedAtLabel = computed(() => {
  return new Date(props.newsletter.receivedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})

const problemCountLabel = computed(() => {
  const count = props.newsletter.problemCount
  return `${count} probleme${count > 1 ? 's' : ''}`
})
</script>

<template>
  <UCard
    :ui="{
      body: 'p-4 sm:p-4',
    }"
  >

    <div class="relative flex items-center gap-3 sm:gap-4">
      <div class="mt-0.5 flex sm:h-10 sm:w-10 h-8 w-8 shrink-0 items-center justify-center  rounded-lg sm:rounded-xl bg-neutral-50 text-neutral-500">
        <UIcon
          :name="newsletter.sourceType === 'mailgun' ? 'i-lucide-mail' : 'i-lucide-file-text'"
          class="size-3 sm:size-5 text-toned"
        />
      </div>

      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex items-center gap-2">
          <p class="min-w-0 flex-1 text-sm font-semibold leading-5">
            {{ subjectLabel }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="inline-flex max-w-full items-center gap-1 text-dimmed ">
            <UIcon name="i-lucide-user-round" class="size-3.5 shrink-0" />
            <span class="truncate max-w-56">{{ senderLabel }}</span>
          </span>

          <span class="inline-flex items-center gap-1 text-dimmed ">
            <UIcon name="i-lucide-calendar-days" class="size-3.5" />
            {{ receivedAtLabel }}
          </span>

        </div>
      </div>

      <div class="ms-auto flex shrink-0 items-center gap-2">
          <UBadge
            v-if="newsletter.problemCount > 0"
            color="warning"
            variant="subtle"
            icon="i-lucide-alert-triangle"
            size="sm"
          >
            {{ problemCountLabel }}
          </UBadge>
          <UBadge
            v-else-if="newsletter.problemCount === 0 && newsletter.analyzed"
            color="info"
            variant="subtle"
            icon="i-lucide-check"
            size="sm"
          >
            No problem
        </UBadge>
        <UButton
          v-if="!newsletter.analyzed"
          label="Analyze"
          icon="i-lucide-sparkles"
          size="sm"
          variant="soft"
          :loading="analyzing === newsletter.id"
          @click="emit('trigger-analysis', newsletter.id)"
        />

        <UBadge v-else color="success" variant="subtle" size="sm" class="gap-1.5">
          <UIcon name="i-lucide-check" class="size-3.5" />
          Analyzed
        </UBadge>

      </div>
    </div>
  </UCard>
</template>

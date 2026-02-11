<script setup lang="ts">
import type { NewsletterListItem } from '#shared/types/newsletter'

const props = defineProps<{
  newsletter: NewsletterListItem
  analyzing: string | null
  creditsExhausted?: boolean
  checked?: boolean
  active?: boolean
  selectionMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'trigger-analysis', id: string): void
  (e: 'select', id: string): void
  (e: 'toggle-check', id: string): void
}>()

const subjectLabel = computed(() => props.newsletter.subject?.trim() || '(no subject)')
const senderLabel = computed(() => props.newsletter.fromName?.trim() || props.newsletter.fromEmail?.trim() || 'Unknown sender')
const receivedAtLabel = computed(() => {
  return new Date(props.newsletter.receivedAt).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})

const problemCountLabel = computed(() => {
  const count = props.newsletter.problemCount
  return `${count} problem${count !== 1 ? 's' : ''}`
})

const isAnalyzeDisabled = computed(() => Boolean(props.creditsExhausted))

function onCardClick() {
  emit('select', props.newsletter.id)
}

function onCheckboxChange() {
  emit('toggle-check', props.newsletter.id)
}
</script>

<template>
  <div
    class="group flex items-center gap-3 cursor-pointer rounded-lg border-2 px-4 py-3 transition-all"
    :class="[
      active
        ? 'border-[var(--ui-primary)] bg-[var(--ui-bg-elevated)]'
        : 'border-transparent hover:bg-[var(--ui-bg-elevated)]/50',
    ]"
    @click="onCardClick"
  >
    <!-- Checkbox -->
    <div class="shrink-0" @click.stop>
      <UCheckbox
        :model-value="checked"
        @update:model-value="onCheckboxChange"
      />
    </div>

    <!-- Source icon -->
    <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ui-bg-elevated)] text-[var(--ui-text-dimmed)]">
      <UIcon
        :name="newsletter.sourceType === 'mailgun' ? 'i-lucide-mail' : 'i-lucide-file-text'"
        class="size-4"
      />
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1 space-y-1">
      <p class="text-sm font-semibold leading-5 truncate">
        {{ subjectLabel }}
      </p>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ui-text-dimmed)]">
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-user-round" class="size-3.5 shrink-0" />
          <span class="truncate max-w-48">{{ senderLabel }}</span>
        </span>
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-calendar-days" class="size-3.5" />
          {{ receivedAtLabel }}
        </span>
      </div>
    </div>

    <!-- Badges -->
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
        :disabled="isAnalyzeDisabled"
        @click.stop="emit('trigger-analysis', newsletter.id)"
      />
      <UBadge v-else color="success" variant="subtle" size="sm" class="gap-1.5">
        <UIcon name="i-lucide-check" class="size-3.5" />
        Analyzed
      </UBadge>
    </div>
  </div>
</template>

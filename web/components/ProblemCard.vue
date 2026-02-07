<script setup lang="ts">
defineProps<{
  problem: {
    id: string
    problemSummary: string
    problemDetail: string
    category: string
    severity: string
    originalQuote?: string
    signals?: string[]
    mentionedTools?: string[]
    targetAudience?: string
    newsletterSubject?: string
    createdAt?: string
  }
}>()

const expanded = ref(false)
</script>

<template>
  <UCard>
    <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1">
          <h3 class="font-medium text-sm">{{ problem.problemSummary }}</h3>
          <p v-if="problem.newsletterSubject" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ problem.newsletterSubject }}
          </p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <SeverityBadge :severity="problem.severity" />
          <UBadge variant="subtle" color="neutral">{{ problem.category }}</UBadge>
        </div>
      </div>

      <!-- Detail -->
      <p class="text-sm text-gray-600 dark:text-gray-300">{{ problem.problemDetail }}</p>

      <!-- Expandable section -->
      <button
        v-if="problem.originalQuote || problem.signals?.length"
        class="text-xs text-primary-500 hover:underline"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Show less' : 'Show more' }}
      </button>

      <div v-if="expanded" class="space-y-2">
        <blockquote
          v-if="problem.originalQuote"
          class="text-xs italic border-l-2 border-gray-300 dark:border-gray-600 pl-3 text-gray-500 dark:text-gray-400"
        >
          "{{ problem.originalQuote }}"
        </blockquote>

        <div v-if="problem.signals?.length" class="flex gap-1 flex-wrap">
          <UBadge v-for="signal in problem.signals" :key="signal" variant="subtle" color="neutral" size="xs">
            {{ signal }}
          </UBadge>
        </div>

        <div v-if="problem.mentionedTools?.length" class="flex items-center gap-1 flex-wrap">
          <span class="text-xs text-gray-500">Tools:</span>
          <UBadge v-for="tool in problem.mentionedTools" :key="tool" variant="subtle" color="info" size="xs">
            {{ tool }}
          </UBadge>
        </div>

        <p v-if="problem.targetAudience" class="text-xs text-gray-500">
          Target: {{ problem.targetAudience }}
        </p>
      </div>
    </div>
  </UCard>
</template>

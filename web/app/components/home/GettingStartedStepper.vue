<script setup lang="ts">
  import type { StepperItem } from '@nuxt/ui'

  interface GettingStartedStep extends StepperItem {
    title: string
    description: string
    icon: string
  }

  const items: GettingStartedStep[] = [
    {
      icon: 'i-lucide-upload',
      title: 'Upload newsletters',
      description: 'Import .html, .txt or .eml files, or set up Mailgun to receive them automatically.',
    },
    {
      icon: 'i-lucide-sparkles',
      title: 'Analyze content',
      description: 'GPT-4o extracts problems, pain points and unmet needs from each newsletter.',
    },
    {
      icon: 'i-lucide-layers',
      title: 'Discover clusters',
      description: 'Similar problems are grouped together so you can spot recurring opportunities.',
    },
  ]
</script>

<template>
  <UCard>
    <UStepper
      :items="items"
      orientation="vertical"
      disabled
      class="w-full"
    />

    <div class="mt-4 border-t border-[var(--ui-border)] pt-4">
      <UButton
        to="/app/newsletters"
        label="Go to Newsletters"
        icon="i-lucide-arrow-right"
        trailing
        size="sm"
      />
    </div>
  </UCard>
</template>

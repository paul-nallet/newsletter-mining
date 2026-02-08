<script setup lang="ts">
interface WaitlistChallengeResponse {
  token: string
  minDelayMs: number
  expiresInMs: number
}

interface WaitlistSubmitResponse {
  success: boolean
  status: 'added' | 'already_joined'
  id?: string
}

const props = withDefaults(defineProps<{
  source?: string
  title?: string
  description?: string
  buttonLabel?: string
  compact?: boolean
}>(), {
  source: 'landing-page',
  title: 'Join the waitlist',
  description: 'Drop your email and we will notify you when access opens.',
  buttonLabel: 'Join waitlist',
  compact: false,
})

const inputId = useId()

const waitlistEmail = ref('')
const waitlistCompany = ref('')
const waitlistLoading = ref(false)
const waitlistState = ref<'idle' | 'success' | 'error'>('idle')
const waitlistMessage = ref('')

const {
  data: waitlistChallenge,
  refresh: refreshWaitlistChallenge,
} = await useFetch<WaitlistChallengeResponse>('/api/waitlist/challenge', {
  key: 'waitlist-challenge',
})

async function submitWaitlist() {
  if (waitlistLoading.value) return

  waitlistState.value = 'idle'
  waitlistMessage.value = ''

  const email = waitlistEmail.value.trim()
  if (!email) {
    waitlistState.value = 'error'
    waitlistMessage.value = 'Please enter your email.'
    return
  }

  if (!waitlistChallenge.value?.token) {
    await refreshWaitlistChallenge()
  }

  const challengeToken = waitlistChallenge.value?.token
  if (!challengeToken) {
    waitlistState.value = 'error'
    waitlistMessage.value = 'Unable to validate your request. Please try again.'
    return
  }

  waitlistLoading.value = true

  try {
    const result = await $fetch<WaitlistSubmitResponse>('/api/waitlist', {
      method: 'POST',
      body: {
        email,
        company: waitlistCompany.value,
        challengeToken,
        source: props.source,
      },
    })

    waitlistState.value = 'success'
    waitlistMessage.value = result.status === 'already_joined'
      ? "You're already on the waitlist."
      : "You're on the waitlist. We'll email you when access opens."
    waitlistEmail.value = ''
  }
  catch (error: any) {
    waitlistState.value = 'error'
    waitlistMessage.value
      = error?.data?.statusMessage
        || error?.statusMessage
        || 'Could not join the waitlist right now. Please try again.'
  }
  finally {
    waitlistLoading.value = false
    waitlistCompany.value = ''
    await refreshWaitlistChallenge()
  }
}
</script>

<template>
  <UCard class="border border-[var(--ui-border)] bg-white/90 dark:bg-neutral-900/90">
    <div :class="compact ? 'space-y-2' : 'space-y-3'">
      <div>
        <p class="text-sm font-semibold text-[var(--ui-text-highlighted)]">
          {{ title }}
        </p>
        <p class="text-sm text-[var(--ui-text-muted)]">
          {{ description }}
        </p>
      </div>

      <form class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" @submit.prevent="submitWaitlist">
        <input
          v-model="waitlistCompany"
          type="text"
          name="company"
          autocomplete="off"
          tabindex="-1"
          aria-hidden="true"
          class="sr-only"
        >

        <label :for="inputId" class="sr-only">Email</label>
        <UInput
          :id="inputId"
          v-model="waitlistEmail"
          type="email"
          placeholder="you@company.com"
          autocomplete="email"
          required
          :disabled="waitlistLoading"
        />

        <UButton
          type="submit"
          :label="buttonLabel"
          :loading="waitlistLoading"
          :disabled="waitlistLoading"
          class="justify-center"
        />
      </form>

      <p class="text-xs text-[var(--ui-text-muted)]">
        No spam. One short email when your access is ready.
      </p>

      <p
        v-if="waitlistState !== 'idle'"
        class="text-sm"
        :class="waitlistState === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
      >
        {{ waitlistMessage }}
      </p>
    </div>
  </UCard>
</template>

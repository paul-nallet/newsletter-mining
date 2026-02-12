<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { AudienceLink, AudiencePageContent } from '~/data/audiences'

interface SignupAvailabilityResponse {
  isOpen: boolean
}

const props = defineProps<{
  page: AudiencePageContent
  relatedLinks: AudienceLink[]
}>()

const registerPath = '/register?redirect=/app/upgrade'

const { data: signupAvailability } = await useFetch<SignupAvailabilityResponse>('/api/auth/signup-open', {
  key: `signup-open-${props.page.slug}`,
})

const signupOpen = computed(() => signupAvailability.value?.isOpen !== false)
const ctaSectionId = computed(() => (signupOpen.value ? 'get-access' : 'waitlist'))

const navItems = computed(() => [
  { label: 'Problem', to: '#problem' },
  { label: 'Outcomes', to: '#outcomes' },
  { label: signupOpen.value ? 'Get access' : 'Waitlist', to: `#${ctaSectionId.value}` },
])

const primaryHeaderButton = computed<ButtonProps>(() => (
  signupOpen.value
    ? {
        label: 'Create account',
        to: registerPath,
        color: 'neutral',
      }
    : {
        label: 'Join waitlist',
        to: '#waitlist',
        color: 'neutral',
      }
))

const audienceBadge = computed(() => (
  props.page.audienceRole === 'primary' ? 'Primary audience' : 'Secondary use case'
))
</script>

<template>
  <div class="landing-page min-h-screen">
    <UHeader
      title="Newsletter Mining"
      :ui="{ root: 'sticky top-0 z-40 border-b border-[var(--ui-border)]/70 bg-white/80 backdrop-blur dark:bg-neutral-950/75' }"
    >
      <template #left>
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm font-semibold">
          <span class="inline-flex size-7 items-center justify-center rounded-md bg-[var(--ui-primary)] text-[var(--ui-bg)]">
            NM
          </span>
          Newsletter Mining
        </NuxtLink>
      </template>

      <template #right>
        <UNavigationMenu :items="navItems" variant="link" class="hidden lg:block" />
        <UButton to="/" color="neutral" variant="ghost" label="Main landing" class="hidden sm:inline-flex" />
        <UButton v-bind="primaryHeaderButton" />
      </template>
    </UHeader>

    <UMain>
      <UPageHero
        :headline="props.page.heroHeadline"
        :title="props.page.heroTitle"
        :description="props.page.heroDescription"
        orientation="horizontal"
        :ui="{ container: 'py-16 lg:py-22' }"
      >
        <div class="overflow-hidden rounded-lg border border-[var(--ui-border)] bg-white shadow-xl dark:bg-neutral-900">
          <div class="flex items-center gap-1.5 border-b border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2">
            <span class="size-2.5 rounded-full bg-red-400/60" />
            <span class="size-2.5 rounded-full bg-yellow-400/60" />
            <span class="size-2.5 rounded-full bg-green-400/60" />
            <span class="ml-2 text-xs text-[var(--ui-text-muted)]">Audience playbook</span>
          </div>
          <div class="p-4">
            <UBadge color="neutral" variant="subtle" class="mb-2">
              {{ audienceBadge }}
            </UBadge>
            <p class="text-sm font-medium text-[var(--ui-text-muted)]">
              Ideal for {{ props.page.label }}
            </p>
            <p class="mt-2 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              {{ props.page.proofTitle }}
            </p>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              {{ props.page.proof }}
            </p>
          </div>
        </div>

        <div class="mt-6 max-w-xl">
          <UCard v-if="signupOpen" class="border border-[var(--ui-border)] bg-white/90 dark:bg-neutral-900/90">
            <div class="space-y-3">
              <p class="text-sm font-semibold text-[var(--ui-text-highlighted)]">
                {{ props.page.primaryCtaLabel }}
              </p>
              <p class="text-sm text-[var(--ui-text-muted)]">
                {{ props.page.primaryCtaDescription }}
              </p>
              <div class="flex flex-wrap gap-2">
                <UButton :to="registerPath" color="neutral" label="Create account" />
                <UButton to="/login" color="neutral" variant="ghost" label="Sign in" />
              </div>
            </div>
          </UCard>
          <LandingWaitlistInlineForm
            v-else
            :source="`for-${props.page.slug}-hero`"
            :title="props.page.fallbackWaitlistTitle"
            :description="props.page.fallbackWaitlistDescription"
            button-label="Join waitlist"
          />
        </div>
      </UPageHero>

      <USeparator class="h-px" />

      <UPageSection
        id="problem"
        headline="Problem"
        :title="props.page.painTitle"
        description="The blockers we hear most often from this audience."
      >
        <UPageGrid class="w-full">
          <UPageCard
            v-for="(point, idx) in props.page.painPoints"
            :key="point"
            :title="`Pain point ${idx + 1}`"
            :description="point"
            icon="i-lucide-circle-alert"
            variant="subtle"
          />
        </UPageGrid>
      </UPageSection>

      <USeparator class="h-px" />

      <UPageSection
        id="outcomes"
        headline="Outcome"
        :title="props.page.outcomesTitle"
        description="What Newsletter Mining changes in your weekly workflow."
      >
        <UPageGrid class="w-full">
          <UPageCard
            v-for="(outcome, idx) in props.page.outcomes"
            :key="outcome"
            :title="`Outcome ${idx + 1}`"
            :description="outcome"
            icon="i-lucide-badge-check"
            variant="outline"
          />
        </UPageGrid>

        <div class="mx-auto mt-8 w-full max-w-2xl">
          <UCard v-if="signupOpen" class="border border-[var(--ui-border)] bg-white/90 dark:bg-neutral-900/90">
            <div class="space-y-3">
              <p class="text-sm font-semibold text-[var(--ui-text-highlighted)]">
                Start with one focused newsletter batch
              </p>
              <p class="text-sm text-[var(--ui-text-muted)]">
                Create your account and validate signal quality before scaling volume.
              </p>
              <UButton :to="registerPath" color="neutral" label="Create account" />
            </div>
          </UCard>
          <LandingWaitlistInlineForm
            v-else
            :source="`for-${props.page.slug}-middle`"
            :title="props.page.fallbackWaitlistTitle"
            :description="props.page.fallbackWaitlistDescription"
            button-label="Join waitlist"
          />
        </div>
      </UPageSection>

      <USeparator class="h-px" />

      <UPageSection :id="ctaSectionId" :ui="{ container: 'px-0 sm:px-4' }">
        <UPageCTA
          :title="signupOpen ? `Create your ${props.page.label} account` : `Join the ${props.page.label} waitlist`"
          :description="signupOpen ? 'Start now and convert recurring newsletter signal into better decisions.' : 'Signup is paused right now. Join the waitlist and we will contact you first.'"
          orientation="horizontal"
          class="rounded-none border-y border-[var(--ui-border)] sm:rounded-xl sm:border"
        >
          <div class="grid w-full gap-4 lg:grid-cols-2">
            <UCard class="border border-[var(--ui-border)] bg-white/85 p-4 dark:bg-neutral-900/85">
              <p class="text-xs uppercase tracking-wide text-[var(--ui-text-muted)]">Also explore</p>
              <ul class="mt-3 space-y-2 text-sm">
                <li v-for="item in props.relatedLinks" :key="item.to">
                  <NuxtLink :to="item.to" class="inline-flex items-center gap-2 font-medium hover:underline">
                    <UIcon name="i-lucide-arrow-right" class="size-4" />
                    {{ item.label }}
                  </NuxtLink>
                </li>
              </ul>
            </UCard>

            <UCard v-if="signupOpen" class="border border-[var(--ui-border)] bg-white/90 dark:bg-neutral-900/90">
              <div class="space-y-3">
                <p class="text-sm font-semibold text-[var(--ui-text-highlighted)]">
                  Turn newsletter reading into a weekly decision system
                </p>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Create an account and use recurring pain clusters to guide your next move.
                </p>
                <div class="flex flex-wrap gap-2">
                  <UButton :to="registerPath" color="neutral" label="Create account" />
                  <UButton to="/login" color="neutral" variant="ghost" label="Sign in" />
                </div>
              </div>
            </UCard>
            <LandingWaitlistInlineForm
              v-else
              :source="`for-${props.page.slug}-final`"
              :title="props.page.fallbackWaitlistTitle"
              :description="props.page.fallbackWaitlistDescription"
              button-label="Join waitlist"
            />
          </div>
        </UPageCTA>
      </UPageSection>
    </UMain>
  </div>
</template>

<style scoped>
.landing-page {
  background:
    radial-gradient(40rem 24rem at 0% 0%, color-mix(in oklab, var(--ui-primary) 12%, transparent), transparent 72%),
    radial-gradient(30rem 22rem at 92% 4%, color-mix(in oklab, #777 9%, transparent), transparent 74%),
    var(--ui-bg);
}
</style>

<script setup lang="ts">
import type { AccordionItem, ButtonProps, NavigationMenuItem } from '@nuxt/ui'

definePageMeta({ layout: false })

interface SignupAvailabilityResponse {
  isOpen: boolean
}

const route = useRoute()
const requestURL = useRequestURL()
const canonical = computed(() => new URL(route.path, requestURL.origin).toString())
const registerPath = '/register?redirect=/app/upgrade'

useHead({
  link: [{ rel: 'canonical', href: canonical }],
})

useSeoMeta({
  title: 'Newsletter Mining | Find Product Ideas in Unread Newsletters',
  description: 'Stop hoarding newsletters. Extract recurring pain points, validate demand, and decide what to build next.',
  ogTitle: 'Newsletter Mining | Find Product Ideas in Unread Newsletters',
  ogDescription: 'Extract recurring pain points from newsletters and turn inbox noise into product direction.',
  ogImage: '/images/og-cover.png',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Newsletter Mining | Product Signal from Newsletters',
  twitterDescription: 'Extract recurring pain points and pick stronger product bets.',
  twitterImage: '/images/og-cover.png',
})

const { session } = useAuthSession()
const { data: signupAvailability } = await useFetch<SignupAvailabilityResponse>('/api/auth/signup-open', { key: 'signup-open' })
const { data: waitlistCount } = await useFetch('/api/waitlist/count', { key: 'waitlist-count' })
const signupOpen = computed(() => signupAvailability.value?.isOpen !== false)

const navItems = computed<NavigationMenuItem[]>(() => ([
  { label: 'Product', to: '#features' },
  { label: 'For founders', to: '#audiences' },
  { label: 'How it helps', to: '#pipeline' },
  { label: 'Pricing', to: '#pricing' },
  { label: signupOpen.value ? 'Get access' : 'Waitlist', to: signupOpen.value ? '#get-access' : '#waitlist' },
  { label: 'FAQ', to: '#faq' },
]))

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

const heroLinks = computed<ButtonProps[]>(() => {
  const links: ButtonProps[] = []

  if (signupOpen.value) {
    links.push({
      label: 'Create account',
      to: registerPath,
      color: 'neutral',
      trailingIcon: 'i-lucide-arrow-right',
    })
  }
  else {
    links.push({
      label: 'Join waitlist',
      to: '#waitlist',
      color: 'neutral',
      trailingIcon: 'i-lucide-arrow-right',
    })
  }

  if (session.value.authenticated) {
    links.push({
      label: 'Open dashboard',
      to: '/app',
      color: 'neutral',
      variant: 'subtle',
    })
  }
  else {
    links.push({
      label: 'Sign in',
      to: '/login',
      color: 'neutral',
      variant: 'ghost',
    })
  }

  return links
})

const featureCards = [
  {
    id: 'capture',
    title: 'End inbox overload',
    description: 'Stop juggling saved emails and random tabs. Keep your newsletter signal in one place.',
    icon: 'i-lucide-inbox',
  },
  {
    id: 'extract',
    title: 'Extract recurring customer pain',
    description: 'Spot the same frustration showing up across senders before it becomes obvious.',
    icon: 'i-lucide-search-check',
  },
  {
    id: 'group',
    title: 'See patterns, not noise',
    description: 'When the same pain repeats across sources, it becomes obvious fast.',
    icon: 'i-lucide-layers-3',
  },
  {
    id: 'decide',
    title: 'Pick stronger product bets',
    description: 'Decide with evidence from repeated signals, not one noisy anecdote.',
    icon: 'i-lucide-target',
  },
] as const

const pipelineCards = [
  {
    id: 'step-1',
    title: '1. Stop the overwhelm',
    description: 'Bring scattered newsletters into one weekly view so important signal stops slipping away.',
    icon: 'i-lucide-inbox',
    tag: 'Calmer research loop',
  },
  {
    id: 'step-2',
    title: '2. Spot repeated pain',
    description: 'See which frustrations keep coming back and why they matter to real buyers.',
    icon: 'i-lucide-scan-text',
    tag: 'Real demand signal',
  },
  {
    id: 'step-3',
    title: '3. Back the right bet',
    description: 'Prioritize ideas tied to recurring pain, not the loudest opinion of the week.',
    icon: 'i-lucide-chart-no-axes-column-increasing',
    tag: 'Build with conviction',
  },
] as const

const audienceCards = [
  {
    id: 'indie-hackers',
    title: 'Indie Founders (Primary)',
    description: 'Find what to build next by turning unread newsletters into recurring pain-point signal.',
    to: '/for-indie-hackers',
    cta: 'See founder page',
  },
  {
    id: 'vcs',
    title: 'VCs (Secondary)',
    description: 'Track early market pain from niche newsletters to support faster thesis updates.',
    to: '/for-vcs',
    cta: 'See VC use case',
  },
  {
    id: 'product-managers',
    title: 'Product Managers (Secondary)',
    description: 'Add external pain-point signal to roadmap prioritization without another research sprint.',
    to: '/for-product-managers',
    cta: 'See PM use case',
  },
  {
    id: 'consultants',
    title: 'Consultants (Secondary)',
    description: 'Bring clients clear market pain trends instead of generic newsletter summaries.',
    to: '/for-consultants',
    cta: 'See consultant use case',
  },
] as const

const billingModel = ref('monthly')

const billingItems = ref([
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
])

interface PlanSource {
  title: string
  planId?: string
  description: string
  monthlyPrice: string
  yearlyPrice: string
  billingPeriod: string
  features: string[]
  button: Record<string, any>
  badge?: string
  highlight?: boolean
  scale?: boolean
  tagline?: string
}

async function handlePlanUpgrade(plan: string) {
  const annual = billingModel.value === 'yearly'
  const upgradePath = `/app/upgrade?plan=${encodeURIComponent(plan)}&annual=${annual ? 'true' : 'false'}&source=landing-pricing`

  if (!session.value.authenticated) {
    await navigateTo(`/register?redirect=${encodeURIComponent(upgradePath)}`)
    return
  }

  await navigateTo(upgradePath)
}

const planSources = ref<PlanSource[]>([
  {
    title: 'Starter',
    planId: 'starter',
    description: 'For founders validating their first signal loop.',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    billingPeriod: 'Always free',
    features: [
      '50 newsletter analyses per month',
      'Core opportunity dashboard',
      'Manual re-run of analyses',
      '1 workspace',
    ],
    button: {
      label: 'Choose Starter',
      color: 'neutral',
      variant: 'subtle',
    },
  },
  {
    title: 'Growth',
    planId: 'growth',
    description: 'For indie founders running weekly opportunity discovery.',
    monthlyPrice: '$19',
    yearlyPrice: '$190',
    billingPeriod: 'Monthly or yearly billing',
    badge: 'Most popular',
    highlight: true,
    scale: true,
    tagline: 'Built for consistent signal review',
    features: [
      '500 newsletter analyses per month',
      'Trend and severity tracking',
      'Advanced clustering view',
      'Priority support',
    ],
    button: {
      label: 'Choose Growth',
      color: 'neutral',
    },
  },
  {
    title: 'Studio',
    planId: 'studio',
    description: 'For high-volume operators tracking many topics.',
    monthlyPrice: '$39',
    yearlyPrice: '$390',
    billingPeriod: 'Monthly or yearly billing',
    features: [
      '2,000 newsletter analyses per month',
      'Topic-based segmentation',
      'API access',
      'Guided onboarding',
    ],
    button: {
      label: 'Choose Studio',
      color: 'neutral',
      variant: 'outline',
    },
  },
])

const pricingPlans = computed(() => {
  return planSources.value.map((plan) => {
    const cyclePrice = billingModel.value === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice

    const button = plan.planId
      ? { ...plan.button, onClick: () => handlePlanUpgrade(plan.planId!) }
      : plan.button

    return {
      title: plan.title,
      description: plan.description,
      price: cyclePrice,
      billingCycle: billingModel.value === 'yearly' ? '/year' : '/month',
      billingPeriod: plan.billingPeriod,
      badge: plan.badge,
      highlight: plan.highlight,
      scale: plan.scale,
      tagline: plan.tagline,
      features: plan.features,
      button,
      variant: plan.highlight ? 'subtle' : 'outline',
    }
  })
})

const faqItems = ref<AccordionItem[]>([
  {
    label: 'Do I need technical skills to use this?',
    content: 'No. Setup is straightforward and the dashboard is built for non-technical founders.',
  },
  {
    label: 'What if I already have a large backlog of newsletters?',
    content: 'Import and analyze older newsletters to surface patterns you have likely missed.',
  },
  {
    label: 'How quickly will I see value?',
    content: 'Most founders see recurring themes after the first analysis batch, then refine bets week by week.',
  },
  {
    label: 'Is my inbox data protected?',
    content: 'Inbound requests are verified before processing, and data is kept in your own secured environment.',
  },
  {
    label: 'What newsletters does it work with?',
    content: 'Any newsletter you receive by email or can export as .html/.txt/.eml. Tech, business, marketing, indie hacking - the AI adapts to any topic.',
  },
  {
    label: 'Can I connect my email directly?',
    content: 'Yes, via Mailgun webhook. Newsletters are forwarded automatically - no manual import needed after setup.',
  },
  {
    label: 'What happens to my data if I cancel?',
    content: 'Your data stays available for 30 days after cancellation. You can export it anytime before that.',
  },
  {
    label: 'How is this different from just using ChatGPT?',
    content: 'ChatGPT analyzes one text at a time. Newsletter Mining processes your entire newsletter history, clusters recurring problems across sources, and tracks trends over time.',
  },
])

const footerColumns = [
  {
    label: 'Product',
    children: [
      { label: 'Features', to: '#features' },
      { label: 'By audience', to: '#audiences' },
      { label: 'How it helps', to: '#pipeline' },
      { label: 'Pricing', to: '#pricing' },
    ],
  },
  {
    label: 'Use cases',
    children: [
      { label: 'For Indie Hackers', to: '/for-indie-hackers' },
      { label: 'For VCs', to: '/for-vcs' },
      { label: 'For Product Managers', to: '/for-product-managers' },
      { label: 'For Consultants', to: '/for-consultants' },
    ],
  },
  {
    label: 'Account',
    children: [
      { label: 'Dashboard', to: '/app' },
      { label: 'Newsletters', to: '/app/newsletters' },
      { label: 'Settings', to: '/app/settings' },
    ],
  },
]
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
        <UButton to="/login" color="neutral" variant="ghost" label="Login" class="hidden sm:inline-flex" />
        <UButton v-bind="primaryHeaderButton" />
      </template>

      <template #body>
        <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
        <div class="mt-4 flex flex-wrap gap-2 px-2">
          <UButton to="/login" color="neutral" variant="ghost" label="Login" />
          <UButton v-bind="primaryHeaderButton" />
        </div>
      </template>
    </UHeader>

    <UMain>
      <UPageHero
        headline="Stop hoarding newsletters. Start mining demand."
        title="Turn unread newsletters into product ideas you can defend."
        description="Newsletter Mining extracts recurring pain points from your backlog so you can pick what to build with evidence, not guesswork."
        :links="heroLinks"
        orientation="horizontal"
        :ui="{ container: 'py-16 lg:py-22' }"
      >
        <template #top>
          <div class="hero-aura" />
        </template>

        <div class="overflow-hidden rounded-lg border border-[var(--ui-border)] bg-white shadow-xl dark:bg-neutral-900">
          <div class="flex items-center gap-1.5 border-b border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2">
            <span class="size-2.5 rounded-full bg-red-400/60" />
            <span class="size-2.5 rounded-full bg-yellow-400/60" />
            <span class="size-2.5 rounded-full bg-green-400/60" />
            <span class="ml-2 text-xs text-[var(--ui-text-muted)]">newsletter-mining.com/app</span>
          </div>
          <div class="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
            <div class="rounded-md border border-[var(--ui-border)] p-3">
              <p class="text-xs text-[var(--ui-text-muted)]">Input</p>
              <p class="mt-1 text-sm font-semibold">Unread newsletters</p>
            </div>
            <div class="rounded-md border border-[var(--ui-border)] p-3">
              <p class="text-xs text-[var(--ui-text-muted)]">Output</p>
              <p class="mt-1 text-sm font-semibold">Recurring pain points</p>
            </div>
            <div class="rounded-md border border-[var(--ui-border)] p-3">
              <p class="text-xs text-[var(--ui-text-muted)]">Clarity</p>
              <p class="mt-1 text-sm font-semibold">Grouped by themes</p>
            </div>
            <div class="rounded-md border border-[var(--ui-border)] p-3">
              <p class="text-xs text-[var(--ui-text-muted)]">Decision</p>
              <p class="mt-1 text-sm font-semibold">What to build next</p>
            </div>
          </div>
        </div>

        <div class="mt-6 max-w-xl">
          <UCard v-if="signupOpen" class="border border-[var(--ui-border)] bg-white/90 dark:bg-neutral-900/90">
            <div class="space-y-3">
              <p class="text-sm font-semibold text-[var(--ui-text-highlighted)]">
                Create your account and start analyzing today
              </p>
              <p class="text-sm text-[var(--ui-text-muted)]">
                Skip inbox overwhelm. See recurring pain points in one dashboard.
              </p>
              <div class="flex flex-wrap gap-2">
                <UButton :to="registerPath" color="neutral" label="Create account" />
                <UButton to="/login" color="neutral" variant="ghost" label="Sign in" />
              </div>
            </div>
          </UCard>
          <template v-else>
            <LandingWaitlistInlineForm
              source="hero-section"
              title="Get notified when signup reopens"
              description="Join the waitlist and we will email you as soon as seats open."
              button-label="Join waitlist"
            />
            <p v-if="waitlistCount?.total" class="mt-3 text-center text-sm text-[var(--ui-text-muted)]">
              {{ waitlistCount.total }} {{ waitlistCount.total === 1 ? 'founder' : 'founders' }} on the waitlist
            </p>
          </template>
        </div>
      </UPageHero>

      <USeparator class="h-px" />

      <UPageSection
        id="audiences"
        headline="For founders first"
        title="Built for indie founders, with secondary playbooks for other teams"
        description="Use the founder path by default, then explore role-specific pages when needed."
      >
        <UPageGrid class="w-full">
          <UPageCard
            v-for="audience in audienceCards"
            :key="audience.id"
            :title="audience.title"
            :description="audience.description"
            icon="i-lucide-users"
            variant="subtle"
          >
            <template #footer>
              <UButton
                :to="audience.to"
                color="neutral"
                variant="outline"
                :label="audience.cta"
                trailing-icon="i-lucide-arrow-right"
              />
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageSection>

      <USeparator class="h-px" />

      <UPageSection
        id="features"
        headline="Product"
        title="Built for founders drowning in input and starved for clarity"
        description="Less reading fatigue. Fewer random ideas. A clearer view of what customers repeatedly struggle with."
      >
        <UPageGrid class="w-full">
          <UPageCard
            v-for="feature in featureCards"
            :key="feature.id"
            :title="feature.title"
            :description="feature.description"
            :icon="feature.icon"
            variant="subtle"
          />
        </UPageGrid>
      </UPageSection>

      <USeparator class="h-px" />

      <UPageSection
        id="pipeline"
        headline="How it helps"
        title="Turn newsletter overwhelm into clearer next bets"
        description="One weekly loop focused on outcomes: reduce noise, surface recurring pain, and decide faster."
      >
        <LandingDataFlowAnimation />

        <UPageGrid class="w-full">
          <UPageCard
            v-for="step in pipelineCards"
            :key="step.id"
            :title="step.title"
            :description="step.description"
            :icon="step.icon"
            highlight
            spotlight
            variant="outline"
          >
            <template #footer>
              <UBadge color="neutral" variant="subtle">
                {{ step.tag }}
              </UBadge>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageSection>

      <USeparator class="h-px" />

      <UPageSection
        id="pricing"
        headline="Pricing"
        title="Simple plans, clear limits"
        description="No inflated claims. Pick a plan based on the newsletter volume you actually process."
      >
        <template #links>
          <UTabs
            v-model="billingModel"
            :items="billingItems"
            color="neutral"
            size="xs"
            class="w-52"
            :ui="{
              list: 'ring ring-accented rounded-full',
              indicator: 'rounded-full',
              trigger: 'w-1/2'
            }"
          />
        </template>

        <UPricingPlans scale class="w-full">
          <UPricingPlan
            v-for="plan in pricingPlans"
            :key="plan.title"
            v-bind="plan"
          />
        </UPricingPlans>

        <div class="mx-auto mt-8 w-full max-w-2xl">
          <UCard v-if="signupOpen" class="border border-[var(--ui-border)] bg-white/90 dark:bg-neutral-900/90">
            <div class="space-y-3">
              <p class="text-sm font-semibold text-[var(--ui-text-highlighted)]">
                Ready to start mining your inbox?
              </p>
              <p class="text-sm text-[var(--ui-text-muted)]">
                Create your account, pick a plan, and run your first analysis batch.
              </p>
              <UButton :to="registerPath" color="neutral" label="Create account" />
            </div>
          </UCard>
          <LandingWaitlistInlineForm
            v-else
            source="pricing-section"
            title="Signup is temporarily closed"
            description="Join the waitlist and we will email you when new access opens."
            button-label="Join waitlist"
          />
        </div>
      </UPageSection>

      <USeparator class="h-px" />

      <UPageSection
        id="faq"
        headline="FAQ"
        title="Answers before you start"
        description="Straight answers for non-technical teams and solo founders."
      >
        <UAccordion
          :items="faqItems"
          :default-value="['0']"
          type="multiple"
          :unmount-on-hide="false"
          class="mx-auto w-full max-w-3xl"
          :ui="{
            trigger: 'text-base text-highlighted',
            body: 'text-base text-muted'
          }"
        />
      </UPageSection>

      <UPageSection :id="signupOpen ? 'get-access' : 'waitlist'" :ui="{ container: 'px-0 sm:px-4' }">
        <UPageCTA
          :title="signupOpen ? 'Create your account and start with real signal' : 'Join the waitlist and get notified first'"
          :description="signupOpen ? 'Start now and turn unread newsletters into ranked opportunities.' : 'Drop your email and we will notify you when signup opens again.'"
          orientation="horizontal"
          class="rounded-none border-y border-[var(--ui-border)] sm:rounded-xl sm:border"
        >
          <div class="grid w-full gap-4 lg:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] bg-white/85 p-4 dark:bg-neutral-900/85">
              <p class="text-xs uppercase tracking-wide text-[var(--ui-text-muted)]">What to expect</p>
              <ul class="mt-3 space-y-2 text-sm">
                <li class="flex items-center gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-[var(--ui-primary)]" />
                  Fast setup for non-technical founders
                </li>
                <li class="flex items-center gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-[var(--ui-primary)]" />
                  Weekly view of recurring customer pain
                </li>
                <li class="flex items-center gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-[var(--ui-primary)]" />
                  Ranked opportunities you can defend
                </li>
              </ul>
            </div>

            <UCard v-if="signupOpen" class="border border-[var(--ui-border)] bg-white/90 dark:bg-neutral-900/90">
              <div class="space-y-3">
                <p class="text-sm font-semibold text-[var(--ui-text-highlighted)]">
                  Your unread newsletter backlog is market research
                </p>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Create an account and convert scattered reading into a repeatable product signal loop.
                </p>
                <div class="flex flex-wrap gap-2">
                  <UButton :to="registerPath" color="neutral" label="Create account" />
                  <UButton to="/login" color="neutral" variant="ghost" label="Sign in" />
                </div>
              </div>
            </UCard>
            <LandingWaitlistInlineForm
              v-else
              source="final-cta"
              title="Get notified first"
              description="Enter your email and we will send one message when signup opens."
              button-label="Join waitlist"
            />
          </div>
        </UPageCTA>
      </UPageSection>
    </UMain>

    <USeparator class="h-px" />

    <UFooter>
      <template #top>
        <UContainer>
          <UFooterColumns :columns="footerColumns" />
        </UContainer>
      </template>

      <template #left>
        <p class="text-sm text-[var(--ui-text-muted)]">
          Newsletter Mining - Hidden value from your inbox - {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          :to="signupOpen ? '#get-access' : '#waitlist'"
          icon="i-lucide-rocket"
          :aria-label="signupOpen ? 'Create account' : 'Join waitlist'"
          color="neutral"
          variant="ghost"
        />
        <UButton
          to="/app"
          icon="i-lucide-layout-dashboard"
          aria-label="Dashboard"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </div>
</template>

<style scoped>
.landing-page {
  background:
    radial-gradient(40rem 24rem at 0% 0%, color-mix(in oklab, var(--ui-primary) 12%, transparent), transparent 72%),
    radial-gradient(30rem 22rem at 92% 4%, color-mix(in oklab, #777 9%, transparent), transparent 74%),
    var(--ui-bg);
}

.hero-aura {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(24rem 20rem at 20% 20%, color-mix(in oklab, var(--ui-primary) 10%, transparent), transparent 78%),
    radial-gradient(28rem 18rem at 78% 12%, color-mix(in oklab, var(--ui-primary) 8%, transparent), transparent 80%);
}
</style>

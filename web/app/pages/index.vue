<script setup lang="ts">
import type { AccordionItem, ButtonProps, NavigationMenuItem } from '@nuxt/ui'

definePageMeta({ layout: false })

const route = useRoute()
const requestURL = useRequestURL()
const canonical = computed(() => new URL(route.path, requestURL.origin).toString())

useHead({
  link: [{ rel: 'canonical', href: canonical }],
})

useSeoMeta({
  title: 'Newsletter Mining - Find hidden value in unread newsletters',
  description: 'Too many newsletters and no time to read them all? Turn inbox noise into clear product opportunities.',
  ogTitle: 'Newsletter Mining - Find hidden value in unread newsletters',
  ogDescription: 'Turn inbox noise into clear product opportunities. Extract recurring problems from newsletters with AI.',
  ogImage: '/images/og-cover.png',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Newsletter Mining',
  twitterDescription: 'Turn inbox noise into clear product opportunities.',
  twitterImage: '/images/og-cover.png',
})

const { session } = useAuthSession()

const { data: waitlistCount } = await useFetch('/api/waitlist/count', { key: 'waitlist-count' })

const navItems = ref<NavigationMenuItem[]>([
  { label: 'Product', to: '#features' },
  { label: 'By audience', to: '#audiences' },
  { label: 'How it works', to: '#pipeline' },
  { label: 'Pricing', to: '#pricing' },
  { label: 'Waitlist', to: '#waitlist' },
  { label: 'FAQ', to: '#faq' },
])

const heroLinks = computed<ButtonProps[]>(() => {
  const links: ButtonProps[] = [
    {
      label: 'Join waitlist',
      to: '#waitlist',
      color: 'neutral',
      trailingIcon: 'i-lucide-arrow-right',
    },
  ]
  if (session.value.authenticated) {
    links.push({
      label: 'Open dashboard',
      to: '/app',
      color: 'neutral',
      variant: 'subtle',
    })
  }
  return links
})

const featureCards = [
  {
    id: 'capture',
    title: 'Capture everything automatically',
    description: 'Newsletters flow in without copy-paste, so nothing important gets lost.',
    icon: 'i-lucide-inbox',
  },
  {
    id: 'extract',
    title: 'Pull out real customer pain',
    description: 'We surface recurring frustrations and needs hidden in long email threads.',
    icon: 'i-lucide-search-check',
  },
  {
    id: 'group',
    title: 'Group similar signals',
    description: 'Related problems are grouped so patterns are obvious at a glance.',
    icon: 'i-lucide-layers-3',
  },
  {
    id: 'decide',
    title: 'Prioritize what to build next',
    description: 'See what appears most often, what hurts most, and what is rising fast.',
    icon: 'i-lucide-target',
  },
] as const

const pipelineCards = [
  {
    id: 'step-1',
    title: '1. Collect',
    description: 'Your newsletters are collected in one place in the background.',
    icon: 'i-lucide-inbox',
    tag: 'No manual sorting',
  },
  {
    id: 'step-2',
    title: '2. Detect',
    description: 'The system finds repeated pain points and key quotes for context.',
    icon: 'i-lucide-scan-text',
    tag: 'Clear and readable output',
  },
  {
    id: 'step-3',
    title: '3. Act',
    description: 'You get ranked opportunities so product decisions are faster and safer.',
    icon: 'i-lucide-chart-no-axes-column-increasing',
    tag: 'Focus on what matters',
  },
] as const

const audienceCards = [
  {
    id: 'indie-hackers',
    title: 'Indie Hackers',
    description: 'Find your next side project by extracting recurring pain points from unread newsletters.',
    to: '/for-indie-hackers',
    cta: 'See Indie page',
  },
  {
    id: 'vcs',
    title: 'VCs',
    description: 'Detect emerging market gaps from newsletter signals before they become mainstream.',
    to: '/for-vcs',
    cta: 'See VC page',
  },
  {
    id: 'product-managers',
    title: 'Product Managers',
    description: 'Prioritize roadmap decisions with repeated, evidence-based pain signals.',
    to: '/for-product-managers',
    cta: 'See PM page',
  },
  {
    id: 'consultants',
    title: 'Consultants',
    description: 'Bring stronger insight to client calls with trend and pain-point detection.',
    to: '/for-consultants',
    cta: 'See Consultant page',
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
  originalMonthlyPrice?: string
  originalYearlyPrice?: string
  billingPeriod: string
  features: string[]
  button: Record<string, any>
  badge?: string
  highlight?: boolean
  scale?: boolean
  tagline?: string
  earlyBird?: boolean
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
    description: 'For solo founders getting started with newsletter signal mining.',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    billingPeriod: 'free',
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
    description: 'For non-technical operators who need weekly product insights.',
    monthlyPrice: '$19',
    yearlyPrice: '$190',
    originalMonthlyPrice: '$39',
    originalYearlyPrice: '$390',
    billingPeriod: '2 months free',
    badge: 'Most popular · Early bird -51%',
    highlight: true,
    scale: true,
    tagline: 'Best value for consistent insight',
    earlyBird: true,
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
    description: 'For teams tracking multiple topics and bigger newsletter volumes.',
    monthlyPrice: '$39',
    yearlyPrice: '$390',
    originalMonthlyPrice: '$99',
    originalYearlyPrice: '$990',
    billingPeriod: '2 months free',
    badge: 'Early bird -61%',
    earlyBird: true,
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
    const cycleOriginalPrice = billingModel.value === 'yearly' ? plan.originalYearlyPrice : plan.originalMonthlyPrice

    const button = plan.planId
      ? { ...plan.button, onClick: () => handlePlanUpgrade(plan.planId!) }
      : plan.button

    return {
      title: plan.title,
      description: plan.description,
      price: cycleOriginalPrice ?? cyclePrice,
      discount: cycleOriginalPrice ? cyclePrice : undefined,
      billingCycle: billingModel.value === 'yearly' ? '/year' : '/month',
      billingPeriod: plan.earlyBird
        ? billingModel.value === 'yearly'
          ? `${plan.billingPeriod} (early bird)`
          : 'billed monthly (early bird)'
        : plan.billingPeriod,
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
    content: 'No. The product is designed for non-technical users. Setup is guided and the dashboard is plain-language.',
  },
  {
    label: 'What if I already have a large backlog of newsletters?',
    content: 'You can import old newsletters and analyze them to find patterns you missed over time.',
  },
  {
    label: 'How quickly will I see value?',
    content: 'Most users see recurring themes after their first analysis batch, then refine decisions week by week.',
  },
  {
    label: 'Is my inbox data protected?',
    content: 'Inbound requests are verified before processing, and data is kept in your own secured environment.',
  },
  {
    label: 'What newsletters does it work with?',
    content: 'Any newsletter you receive by email or can export as .html/.txt/.eml. Tech, business, marketing, indie hacking — the AI adapts to any topic.',
  },
  {
    label: 'Can I connect my email directly?',
    content: 'Yes, via Mailgun webhook. Newsletters are forwarded automatically — no manual import needed after setup.',
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
      { label: 'How it works', to: '#pipeline' },
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
        <UButton to="#waitlist" color="neutral" label="Join waitlist" />
      </template>

      <template #body>
        <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
        <div class="mt-4 flex flex-wrap gap-2 px-2">
          <UButton to="/login" color="neutral" variant="ghost" label="Login" />
          <UButton to="#waitlist" color="neutral" label="Join waitlist" />
        </div>
      </template>
    </UHeader>

    <UMain>
      <UPageHero
        headline="Too many newsletters. Not enough time."
        title="Find hidden product opportunities in newsletters you no longer read."
        description="Newsletter Mining turns inbox overload into clear, ranked opportunities so you can make better product bets faster."
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
          <LandingWaitlistInlineForm
            source="hero-section"
            title="See hidden value in your unread newsletters"
            description="Join the waitlist and get early beta access."
            button-label="Join waitlist"
          />
          <p v-if="waitlistCount?.total" class="mt-3 text-center text-sm text-[var(--ui-text-muted)]">
            {{ waitlistCount.total }} {{ waitlistCount.total === 1 ? 'founder' : 'founders' }} on the waitlist
          </p>
        </div>
      </UPageHero>

      <USeparator class="h-px" />

      <UPageSection
        id="audiences"
        headline="By audience"
        title="Choose the page built for your workflow"
        description="Each page has dedicated messaging, use cases, and waitlist tracking."
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
        title="Built for people who want insight, not technical complexity"
        description="Everything is designed to make hidden value obvious in minutes."
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
        headline="How it works"
        title="From inbox overload to clear product direction in 3 steps"
        description="No complex workflow. Just a repeatable system you can trust every week."
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
        description="Early bird pricing is live: up to 61% off for early users."
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
          <LandingWaitlistInlineForm
            source="pricing-section"
            title="Lock your beta access"
            description="Join now to lock early bird pricing when your invite is ready."
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

      <UPageSection :ui="{ container: 'px-0 sm:px-4' }">
        <UPageCTA
          id="waitlist"
          title="Join the waitlist and turn inbox overload into clear opportunities"
          description="Drop your email and get early access when waitlist seats open."
          orientation="horizontal"
          class="rounded-none border-y border-[var(--ui-border)] sm:rounded-xl sm:border"
        >
          <div class="grid w-full gap-4 lg:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] bg-white/85 p-4 dark:bg-neutral-900/85">
              <p class="text-xs uppercase tracking-wide text-[var(--ui-text-muted)]">What to expect</p>
              <ul class="mt-3 space-y-2 text-sm">
                <li class="flex items-center gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-[var(--ui-primary)]" />
                  Fast setup for non-technical users
                </li>
                <li class="flex items-center gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-[var(--ui-primary)]" />
                  Weekly view of recurring customer pain
                </li>
                <li class="flex items-center gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-[var(--ui-primary)]" />
                  Priority list for smarter product bets
                </li>
              </ul>
            </div>

            <LandingWaitlistInlineForm
              source="final-cta"
              title="Get early access"
              description="Enter your email to join the waitlist and lock early bird pricing."
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
          to="#waitlist"
          icon="i-lucide-rocket"
          aria-label="Join waitlist"
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

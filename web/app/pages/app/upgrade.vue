<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

type BillingModel = 'monthly' | 'yearly'
type PlanId = 'starter' | 'growth' | 'studio'

interface SubscriptionRecord {
  plan: string
  status: string
  periodEnd?: string | Date | null
  trialEnd?: string | Date | null
  cancelAtPeriodEnd?: boolean | null
}

interface PlanOption {
  id: PlanId
  title: string
  monthlyPrice: string
  yearlyPrice: string
  monthlyLabel: string
  yearlyLabel: string
  description: string
  features: string[]
  trialLabel?: string
}

const route = useRoute()
const toast = useToast()

const billingItems = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const planOptions: PlanOption[] = [
  {
    id: 'starter',
    title: 'Starter',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    monthlyLabel: 'free',
    yearlyLabel: 'free',
    description: 'A lightweight plan for solo founders starting out.',
    features: [
      '50 newsletter analyses per month',
      'Core opportunity dashboard',
      'Manual re-run of analyses',
      '1 workspace',
    ],
  },
  {
    id: 'growth',
    title: 'Growth',
    monthlyPrice: '$19',
    yearlyPrice: '$190',
    monthlyLabel: 'per month',
    yearlyLabel: 'per year',
    description: 'For operators who want reliable weekly insight.',
    trialLabel: '14-day free trial - card required',
    features: [
      '500 newsletter analyses per month',
      'Trend and severity tracking',
      'Advanced clustering view',
      'Priority support',
    ],
  },
  {
    id: 'studio',
    title: 'Studio',
    monthlyPrice: '$39',
    yearlyPrice: '$390',
    monthlyLabel: 'per month',
    yearlyLabel: 'per year',
    description: 'For bigger volume and multi-topic tracking.',
    trialLabel: '14-day free trial - card required',
    features: [
      '2,000 newsletter analyses per month',
      'Topic-based segmentation',
      'API access',
      'Guided onboarding',
    ],
  },
]

function parsePlan(value: unknown, fallback: PlanId = 'growth'): PlanId {
  if (value === 'starter' || value === 'growth' || value === 'studio') return value
  return fallback
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDate(value: string | Date | null | undefined): string {
  const parsed = toDate(value)
  if (!parsed) return ''
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

const billingModel = ref<BillingModel>(route.query.annual === 'true' ? 'yearly' : 'monthly')
const selectedPlan = ref<PlanId>(parsePlan(
  typeof route.query.plan === 'string' ? route.query.plan.toLowerCase() : undefined,
  'growth',
))
const checkoutLoading = ref(false)

const { data: subscriptions } = await useAsyncData('subscriptions-upgrade-page', async () => {
  const { data } = await authClient.subscription.list()
  return (data ?? []) as SubscriptionRecord[]
})

const activeSubscription = computed(() => {
  return subscriptions.value?.find((s) => s.status === 'active' || s.status === 'trialing') ?? null
})

const currentPlan = computed<PlanId>(() => parsePlan(
  activeSubscription.value?.plan?.toLowerCase(),
  'starter',
))

const selectedPlanMeta = computed(() => {
  return planOptions.find((option) => option.id === selectedPlan.value) ?? planOptions[1]
})

const selectedPlanPrice = computed(() => {
  return billingModel.value === 'yearly'
    ? selectedPlanMeta.value.yearlyPrice
    : selectedPlanMeta.value.monthlyPrice
})

const selectedPlanBillingLabel = computed(() => {
  return billingModel.value === 'yearly'
    ? selectedPlanMeta.value.yearlyLabel
    : selectedPlanMeta.value.monthlyLabel
})

const isStarterDowngradePath = computed(() => {
  return selectedPlan.value === 'starter'
    && Boolean(activeSubscription.value)
    && currentPlan.value !== 'starter'
})

const cancelUrl = computed(() => {
  const annual = billingModel.value === 'yearly' ? 'true' : 'false'
  return `/app/upgrade?plan=${encodeURIComponent(selectedPlan.value)}&annual=${annual}`
})

async function openBillingPortal() {
  await authClient.subscription.billingPortal({
    returnUrl: '/app/settings',
  })
}

async function continueToCheckout() {
  if (isStarterDowngradePath.value) {
    toast.add({
      title: 'Downgrade handled in Settings',
      description: 'Use "Passer a Starter (fin de periode)" in Settings to keep billing consistent.',
      color: 'warning',
    })
    await navigateTo('/app/settings')
    return
  }

  if (activeSubscription.value && selectedPlan.value === currentPlan.value) {
    await openBillingPortal()
    return
  }

  checkoutLoading.value = true
  try {
    await authClient.subscription.upgrade({
      plan: selectedPlan.value,
      annual: billingModel.value === 'yearly',
      successUrl: '/app/settings',
      cancelUrl: cancelUrl.value,
    })
  }
  catch (e: any) {
    toast.add({
      title: 'Checkout failed',
      description: e?.message || 'Unknown error',
      color: 'error',
    })
    checkoutLoading.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Choose your plan" />
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard v-if="activeSubscription">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-sm text-[var(--ui-text-muted)]">Current subscription</p>
              <p class="text-lg font-semibold capitalize">{{ currentPlan }}</p>
              <p v-if="activeSubscription.trialEnd" class="text-xs text-[var(--ui-text-muted)]">
                Trial ends on {{ formatDate(activeSubscription.trialEnd) }}
              </p>
              <p v-if="activeSubscription.periodEnd" class="text-xs text-[var(--ui-text-muted)]">
                Current period ends on {{ formatDate(activeSubscription.periodEnd) }}
              </p>
            </div>
            <UBadge
              :color="activeSubscription.status === 'active' ? 'success' : 'warning'"
              variant="subtle"
            >
              {{ activeSubscription.status }}
            </UBadge>
          </div>
        </UCard>

        <UCard>
          <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-sm font-medium">Billing cycle</p>
                <p class="text-xs text-[var(--ui-text-muted)]">
                  Growth and Studio include a 14-day free trial.
                </p>
              </div>
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
            </div>

            <div class="grid gap-3 lg:grid-cols-3">
              <button
                v-for="option in planOptions"
                :key="option.id"
                type="button"
                class="rounded-lg border p-4 text-left transition"
                :class="selectedPlan === option.id
                  ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)]/5'
                  : 'border-[var(--ui-border)] hover:border-[var(--ui-primary)]/40'"
                @click="selectedPlan = option.id"
              >
                <p class="text-sm font-medium">{{ option.title }}</p>
                <p class="mt-1 text-2xl font-semibold">
                  {{ billingModel === 'yearly' ? option.yearlyPrice : option.monthlyPrice }}
                </p>
                <p class="text-xs text-[var(--ui-text-muted)]">
                  {{ billingModel === 'yearly' ? option.yearlyLabel : option.monthlyLabel }}
                </p>
                <p class="mt-2 text-sm text-[var(--ui-text-muted)]">{{ option.description }}</p>
                <p v-if="option.trialLabel" class="mt-2 text-xs font-medium text-[var(--ui-primary)]">
                  {{ option.trialLabel }}
                </p>
                <ul class="mt-3 space-y-1 text-xs text-[var(--ui-text-muted)]">
                  <li v-for="feature in option.features" :key="feature">
                    - {{ feature }}
                  </li>
                </ul>
              </button>
            </div>

            <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4">
              <p class="text-sm font-medium">Selected plan</p>
              <p class="text-base font-semibold">
                {{ selectedPlanMeta.title }} - {{ selectedPlanPrice }} {{ selectedPlanBillingLabel }}
              </p>
              <p v-if="selectedPlanMeta.trialLabel" class="text-xs text-[var(--ui-text-muted)]">
                {{ selectedPlanMeta.trialLabel }}
              </p>
              <p v-else class="text-xs text-[var(--ui-text-muted)]">
                Starter is billed at $0.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton
                :loading="checkoutLoading"
                :label="activeSubscription && selectedPlan === currentPlan ? 'Manage Billing' : 'Continue to Checkout'"
                icon="i-lucide-arrow-right-circle"
                @click="continueToCheckout"
              />
              <UButton
                to="/app/settings"
                label="Back to Settings"
                color="neutral"
                variant="outline"
              />
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

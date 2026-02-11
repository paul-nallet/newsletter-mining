export interface AudienceLink {
  label: string
  to: string
}

export interface AudiencePageContent {
  slug: 'indie-hackers' | 'vcs' | 'product-managers' | 'consultants'
  label: string
  heroHeadline: string
  heroTitle: string
  heroDescription: string
  primaryCta: string
  painTitle: string
  painPoints: string[]
  outcomesTitle: string
  outcomes: string[]
  proofTitle: string
  proof: string
  waitlistTitle: string
  waitlistDescription: string
  seoTitle: string
  seoDescription: string
}

export const audiencePages: Record<AudiencePageContent['slug'], AudiencePageContent> = {
  'indie-hackers': {
    slug: 'indie-hackers',
    label: 'Indie Hackers',
    heroHeadline: 'For Indie Hackers',
    heroTitle: 'Turn unread newsletters into your next side project',
    heroDescription: 'Forward your newsletters. Newsletter Mining extracts recurring problems, shows what is trending, and helps you pick ideas before they get crowded.',
    primaryCta: 'Join the Indie waitlist',
    painTitle: 'What slows you down',
    painPoints: [
      'You save dozens of newsletters but never review them.',
      'You forget pain points after reading.',
      'You are unsure which idea has real demand.',
    ],
    outcomesTitle: 'What you get',
    outcomes: [
      'A ranked list of recurring problems worth building for.',
      'Topic clusters so patterns are obvious in minutes.',
      'A weekly signal brief to keep idea selection clear.',
    ],
    proofTitle: 'Built for speed',
    proof: 'No technical setup required. Forward emails and review opportunities from one dashboard.',
    waitlistTitle: 'Get early access for Indie Hackers',
    waitlistDescription: 'Join the waitlist to lock beta pricing at 50% off.',
    seoTitle: 'Newsletter Mining for Indie Hackers | Find your next side project',
    seoDescription: 'Turn unread newsletters into validated side project ideas. Discover recurring pain points and trending opportunities before they get crowded.',
  },
  vcs: {
    slug: 'vcs',
    label: 'VCs',
    heroHeadline: 'For VCs',
    heroTitle: 'Deal sourcing through signal detection',
    heroDescription: 'We analyze industry newsletters to identify emerging pain points and market gaps before they hit mainstream coverage, so you can see what is heating up in your verticals.',
    primaryCta: 'Join the VC waitlist',
    painTitle: 'Where traditional sourcing misses early signal',
    painPoints: [
      'The most useful signals are buried in niche newsletters, not in one feed.',
      'By the time a trend reaches broad media, pricing and competition have already moved.',
      'Associate-level scanning is hard to standardize across sectors and geographies.',
      'Weekly partner updates often lack structured evidence behind thesis shifts.',
    ],
    outcomesTitle: 'What your team gets',
    outcomes: [
      'Vertical-specific monitoring that converts newsletter flow into structured market signal.',
      'Recurring pain-point detection to spot demand before momentum is obvious.',
      'Trend movement over time, so you can see which problems are accelerating vs. fading.',
      'Faster IC preparation with evidence-backed summaries instead of ad hoc notes.',
    ],
    proofTitle: 'Built for investment teams',
    proof: 'From deal sourcing to IC prep, track market pain with structured signals instead of fragmented reading.',
    waitlistTitle: 'Access the VC beta',
    waitlistDescription: 'Join the waitlist to get early access and keep beta pricing at 50% off.',
    seoTitle: 'Newsletter Mining for VCs | Deal sourcing through signal detection',
    seoDescription: 'Identify emerging pain points and market gaps from industry newsletters before they become mainstream. Track what is heating up in your verticals.',
  },
  'product-managers': {
    slug: 'product-managers',
    label: 'Product Managers',
    heroHeadline: 'For Product Managers',
    heroTitle: 'Prioritize roadmap bets with real market signal',
    heroDescription: 'Track repeated user problems across newsletters and communities. Replace gut-feel prioritization with evidence that demand keeps repeating.',
    primaryCta: 'Get PM early access',
    painTitle: 'What creates roadmap friction',
    painPoints: [
      'Feature requests are noisy and hard to compare.',
      'Roadmap debates rely on opinions, not clear evidence.',
      'Customer pain appears in many channels but stays fragmented.',
    ],
    outcomesTitle: 'What you get',
    outcomes: [
      'Clustered pain points with trend and frequency context.',
      'A clearer signal for what to prioritize next.',
      'One place to monitor repeated demand over time.',
    ],
    proofTitle: 'Built for prioritization',
    proof: 'Make roadmap calls with repeated, cross-source signal instead of isolated anecdotes.',
    waitlistTitle: 'Get product team access',
    waitlistDescription: 'Join the waitlist and secure the 50% beta offer.',
    seoTitle: 'Newsletter Mining for Product Managers | Prioritize with real signal',
    seoDescription: 'Track recurring user pain points across newsletters and communities to prioritize roadmap work with clearer evidence.',
  },
  consultants: {
    slug: 'consultants',
    label: 'Consultants',
    heroHeadline: 'For Consultants',
    heroTitle: 'Bring hidden market insight to every client call',
    heroDescription: 'Monitor newsletters in your clients\' industries and uncover rising pain points early. Arrive with insights they did not know existed.',
    primaryCta: 'Join the Consultant waitlist',
    painTitle: 'What hurts delivery',
    painPoints: [
      'Research takes too long and repeats every week.',
      'Clients expect proactive insights, not summaries.',
      'Signals are easy to miss when content volume grows.',
    ],
    outcomesTitle: 'What you get',
    outcomes: [
      'Automated signal monitoring per client industry.',
      'Early visibility into rising pain points and trends.',
      'Sharper meeting prep with insight-backed recommendations.',
    ],
    proofTitle: 'Built for client-facing teams',
    proof: 'Convert newsletter volume into usable insight that improves client conversations.',
    waitlistTitle: 'Get consultant early access',
    waitlistDescription: 'Join now and keep beta pricing at 50% off.',
    seoTitle: 'Newsletter Mining for Consultants | Market intelligence on autopilot',
    seoDescription: 'Monitor industry newsletters to detect emerging pain points and bring stronger insight into client strategy calls.',
  },
}

export function buildAudienceLinks(currentSlug: AudiencePageContent['slug']): AudienceLink[] {
  return Object.values(audiencePages)
    .filter(({ slug }) => slug !== currentSlug)
    .map(({ slug, label }) => ({
      label,
      to: `/for-${slug}`,
    }))
}

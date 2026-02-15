export interface AudienceLink {
  label: string
  to: string
}

export interface AudiencePageContent {
  slug: 'indie-hackers' | 'vcs' | 'product-managers' | 'consultants'
  label: string
  audienceRole: 'primary' | 'secondary'
  heroHeadline: string
  heroTitle: string
  heroDescription: string
  primaryCtaLabel: string
  primaryCtaDescription: string
  painTitle: string
  painPoints: string[]
  outcomesTitle: string
  outcomes: string[]
  proofTitle: string
  proof: string
  fallbackWaitlistTitle: string
  fallbackWaitlistDescription: string
  seoTitle: string
  seoDescription: string
}

export const audiencePages: Record<AudiencePageContent['slug'], AudiencePageContent> = {
  'indie-hackers': {
    slug: 'indie-hackers',
    label: 'Indie Hackers',
    audienceRole: 'primary',
    heroHeadline: 'Primary Audience: Indie Founders',
    heroTitle: 'Your unread newsletters are hiding your next product',
    heroDescription: 'Stop collecting links you never revisit. ScopeSight extracts recurring pain and ranks what to build next from your existing newsletter stack.',
    primaryCtaLabel: 'Create founder account',
    primaryCtaDescription: 'Start now and run your first analysis batch from one dashboard.',
    painTitle: 'Why most founder research loops stall',
    painPoints: [
      'You save newsletters, but rarely convert them into decisions.',
      'One loud story hijacks your roadmap before you validate repeat demand.',
      'Your idea backlog grows faster than your confidence to pick one.',
    ],
    outcomesTitle: 'What changes after setup',
    outcomes: [
      'Recurring pain points are grouped into clear opportunity clusters.',
      'You see what repeats across sources instead of trusting memory.',
      'You pick bets with evidence from real market language.',
    ],
    proofTitle: 'Built for one founder, not a research team',
    proof: 'The product ingests newsletters, extracts problems, and clusters patterns in one flow. No custom pipeline required.',
    fallbackWaitlistTitle: 'Signup is temporarily closed',
    fallbackWaitlistDescription: 'Join the waitlist and we will notify you when founder access reopens.',
    seoTitle: 'ScopeSight for Indie Founders | Turn Newsletters into Product Ideas',
    seoDescription: 'Analyze unread newsletters, extract recurring pain points, and prioritize better product ideas with evidence.',
  },
  vcs: {
    slug: 'vcs',
    label: 'VCs',
    audienceRole: 'secondary',
    heroHeadline: 'Secondary Use Case: VCs',
    heroTitle: 'Track market pain before it turns into consensus',
    heroDescription: 'Use newsletter flow as an early signal layer for thesis updates. Surface recurring pain before it reaches broad coverage.',
    primaryCtaLabel: 'Create account for signal tracking',
    primaryCtaDescription: 'Open an account and test the workflow on one vertical first.',
    painTitle: 'Where sourcing visibility breaks down',
    painPoints: [
      'Niche newsletters contain useful signal but are hard to monitor consistently.',
      'By the time broad media confirms a trend, valuation and competition have moved.',
      'Team notes are inconsistent across sectors and hard to compare over time.',
    ],
    outcomesTitle: 'What the workflow improves',
    outcomes: [
      'Recurring market pain is structured into comparable clusters.',
      'Trend direction is easier to track across weekly updates.',
      'You walk into review meetings with evidence instead of fragmented reading notes.',
    ],
    proofTitle: 'Same signal engine, different decision context',
    proof: 'The same extraction and clustering workflow can support investment research when adapted by vertical.',
    fallbackWaitlistTitle: 'VC access waitlist',
    fallbackWaitlistDescription: 'Signup is currently paused. Join the waitlist to get invited when access reopens.',
    seoTitle: 'ScopeSight for VCs | Detect Market Pain Signals Early',
    seoDescription: 'Analyze industry newsletters to detect recurring market pain points and emerging opportunities earlier.',
  },
  'product-managers': {
    slug: 'product-managers',
    label: 'Product Managers',
    audienceRole: 'secondary',
    heroHeadline: 'Secondary Use Case: Product Managers',
    heroTitle: 'Prioritize roadmap bets with recurring external signal',
    heroDescription: 'Add newsletter-derived pain patterns to your existing customer input so roadmap decisions are less opinion-driven.',
    primaryCtaLabel: 'Create account for roadmap signal',
    primaryCtaDescription: 'Start with one product area and monitor recurring pain weekly.',
    painTitle: 'Why roadmap prioritization gets noisy',
    painPoints: [
      'Feature requests arrive in fragments and are hard to compare objectively.',
      'Roadmap debates over-index on internal opinions and recent anecdotes.',
      'External market pain is visible, but buried in content nobody has time to process.',
    ],
    outcomesTitle: 'What this adds to your process',
    outcomes: [
      'Recurring pain is grouped into themes your team can discuss quickly.',
      'You get consistent evidence to support priority calls.',
      'You spend less time collecting scattered input and more time deciding.',
    ],
    proofTitle: 'External signal without heavyweight research ops',
    proof: 'The workflow runs from newsletter ingestion to clustered pain summaries in one place.',
    fallbackWaitlistTitle: 'PM access waitlist',
    fallbackWaitlistDescription: 'Signup is currently paused. Join the waitlist and we will contact you when access opens.',
    seoTitle: 'ScopeSight for Product Managers | Prioritize with Market Signal',
    seoDescription: 'Extract recurring pain points from newsletters to support stronger roadmap prioritization decisions.',
  },
  consultants: {
    slug: 'consultants',
    label: 'Consultants',
    audienceRole: 'secondary',
    heroHeadline: 'Secondary Use Case: Consultants',
    heroTitle: 'Bring sharper market pain insight to every client call',
    heroDescription: 'Monitor industry newsletters across client domains and surface recurring pain before your next strategy session.',
    primaryCtaLabel: 'Create account for client research',
    primaryCtaDescription: 'Set up one client vertical and validate weekly signal quality fast.',
    painTitle: 'What weakens client recommendations',
    painPoints: [
      'Research cycles repeat weekly and consume too much delivery time.',
      'Clients ask for proactive insight, not curated reading lists.',
      'Important pain trends are easy to miss when newsletter volume spikes.',
    ],
    outcomesTitle: 'What improves with this workflow',
    outcomes: [
      'Recurring client-relevant pain is grouped into clear themes.',
      'You identify rising topics earlier across industry sources.',
      'You show up to calls with stronger evidence behind recommendations.',
    ],
    proofTitle: 'Designed for repeatable market scanning',
    proof: 'The same ingestion and clustering engine can support consultant-led market monitoring workflows.',
    fallbackWaitlistTitle: 'Consultant access waitlist',
    fallbackWaitlistDescription: 'Signup is currently paused. Join the waitlist and we will notify you when seats reopen.',
    seoTitle: 'ScopeSight for Consultants | Find Recurring Market Pain Faster',
    seoDescription: 'Analyze industry newsletters, detect recurring pain points, and strengthen client recommendations with evidence.',
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

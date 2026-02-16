<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const requestURL = useRequestURL()
const canonical = computed(() => new URL(route.path, requestURL.origin).toString())

useSeoMeta({
  title: 'Privacy Policy | ScopeSight',
  description: 'Privacy Policy for ScopeSight. Learn how we collect, use, and protect your data.',
  ogTitle: 'Privacy Policy | ScopeSight',
  ogDescription: 'Privacy Policy for ScopeSight.',
})

useHead({
  link: [{ rel: 'canonical', href: canonical }],
})
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)]">
    <UHeader :ui="{ root: 'border-b border-[var(--ui-border)]' }">
      <template #left>
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm font-semibold">
          <span class="inline-flex size-7 items-center justify-center rounded-md bg-[var(--ui-primary)] text-[var(--ui-bg)]">
            SS
          </span>
          ScopeSight
        </NuxtLink>
      </template>

      <template #right>
        <UButton to="/" color="neutral" variant="ghost" label="Back to home" icon="i-lucide-arrow-left" />
      </template>
    </UHeader>

    <UContainer class="max-w-3xl py-12">
      <div class="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Privacy Policy</h1>
        <p class="text-lg text-[var(--ui-text-muted)]">
          Last updated: February 2025
        </p>

        <h2>1. Data We Collect</h2>
        <p>We collect the following data when you use ScopeSight:</p>
        <ul>
          <li><strong>Account data:</strong> email address, name, and password (hashed).</li>
          <li><strong>Newsletter content:</strong> the newsletters you submit for analysis, including sender, subject, and body text.</li>
          <li><strong>Usage data:</strong> pages visited, features used, and analysis requests made.</li>
          <li><strong>Payment data:</strong> handled entirely by Stripe. We do not store your card details.</li>
        </ul>

        <h2>2. Legal Basis for Processing</h2>
        <p>We process your data under the following legal bases (GDPR Article 6):</p>
        <ul>
          <li><strong>Contract performance:</strong> processing your newsletters and managing your account is necessary to provide the Service.</li>
          <li><strong>Consent:</strong> you consent to the processing of your newsletter content when you submit it for analysis.</li>
          <li><strong>Legitimate interest:</strong> we use anonymized, aggregated usage data to improve the Service.</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <ul>
          <li>Analyze your newsletters using AI to extract pain points and opportunities.</li>
          <li>Display analysis results in your dashboard.</li>
          <li>Send transactional emails (account confirmation, password reset, billing).</li>
          <li>Improve the Service based on aggregated, anonymized usage patterns.</li>
        </ul>
        <p>
          <strong>We do not sell your data.</strong> We do not use your newsletter content for advertising or share it with third parties for marketing purposes.
        </p>

        <h2>4. Sub-processors</h2>
        <p>We use the following third-party services to operate ScopeSight:</p>
        <ul>
          <li><strong>Mailgun</strong> (Sinch) &mdash; email ingestion and transactional email delivery.</li>
          <li><strong>OpenAI</strong> &mdash; AI-powered newsletter analysis. Newsletter content is sent to OpenAI's API for processing. OpenAI does not use API inputs for model training.</li>
          <li><strong>Stripe</strong> &mdash; payment processing and subscription management.</li>
        </ul>

        <h2>5. Data Retention</h2>
        <ul>
          <li><strong>Active account:</strong> data is retained as long as your account is active.</li>
          <li><strong>After deletion:</strong> your data is permanently deleted 30 days after you delete your account.</li>
          <li><strong>Backups:</strong> data may persist in encrypted backups for up to 90 days after deletion.</li>
        </ul>

        <h2>6. Your Rights (GDPR)</h2>
        <p>As a user, you have the following rights under the GDPR:</p>
        <ul>
          <li><strong>Access:</strong> request a copy of the data we hold about you.</li>
          <li><strong>Rectification:</strong> correct inaccurate personal data.</li>
          <li><strong>Erasure:</strong> request deletion of your account and data.</li>
          <li><strong>Portability:</strong> receive your data in a structured, machine-readable format.</li>
          <li><strong>Restriction:</strong> request limitation of processing.</li>
          <li><strong>Objection:</strong> object to processing based on legitimate interest.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <a href="mailto:privacy@scopesight.app">privacy@scopesight.app</a>.
        </p>

        <h2>7. Cookies</h2>
        <p>
          ScopeSight uses <strong>minimal cookies</strong> strictly necessary for the Service to function:
        </p>
        <ul>
          <li><strong>Session cookie:</strong> maintains your authentication state. Essential, no consent required.</li>
        </ul>
        <p>
          We do not use analytics cookies, advertising cookies, or third-party tracking cookies.
        </p>

        <h2>8. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your data, including encrypted connections (TLS), hashed passwords, and access controls on our infrastructure.
        </p>

        <h2>9. International Transfers</h2>
        <p>
          Some sub-processors (OpenAI, Stripe) are based in the United States. Data transfers are covered by Standard Contractual Clauses (SCCs) or equivalent safeguards as required by GDPR.
        </p>

        <h2>10. Contact &amp; DPO</h2>
        <p>
          For any questions about this Privacy Policy or to exercise your data rights, contact our Data Protection Officer:
        </p>
        <p>
          Email: <a href="mailto:privacy@scopesight.app">privacy@scopesight.app</a>
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes via email. The "Last updated" date at the top reflects the latest revision.
        </p>

        <USeparator class="my-10" />

        <h2>Version fran&ccedil;aise (r&eacute;sum&eacute;)</h2>
        <p>
          ScopeSight collecte votre adresse email, votre nom et le contenu des newsletters que vous soumettez pour analyse. Vos donn&eacute;es sont trait&eacute;es sur la base de l'ex&eacute;cution du contrat et de votre consentement. Nous utilisons Mailgun (email), OpenAI (analyse IA) et Stripe (paiement) comme sous-traitants. Vos donn&eacute;es ne sont jamais vendues ni utilis&eacute;es &agrave; des fins publicitaires.
        </p>
        <p>
          Conform&eacute;ment au RGPD, vous disposez d'un droit d'acc&egrave;s, de rectification, de suppression, de portabilit&eacute;, de limitation et d'opposition. Vos donn&eacute;es sont supprim&eacute;es 30 jours apr&egrave;s la cl&ocirc;ture de votre compte. Nous n'utilisons que des cookies de session essentiels. Pour exercer vos droits, contactez <a href="mailto:privacy@scopesight.app">privacy@scopesight.app</a>.
        </p>
      </div>

      <div class="mt-12">
        <UButton to="/" color="neutral" variant="ghost" label="Back to home" icon="i-lucide-arrow-left" />
      </div>
    </UContainer>
  </div>
</template>

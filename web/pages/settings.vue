<script setup lang="ts">
const generating = ref(false)
const generateResult = ref<{ success: boolean, totalClusters?: number, totalProblems?: number } | null>(null)

async function regenerateClusters() {
  generating.value = true
  generateResult.value = null
  try {
    const result = await $fetch('/api/clusters/generate', { method: 'POST' })
    generateResult.value = result
  }
  catch (e: any) {
    generateResult.value = { success: false }
  }
  finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold">Settings</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configuration and actions</p>
    </div>

    <!-- Clustering -->
    <UCard>
      <template #header>
        <h2 class="font-semibold">Problem Clustering</h2>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Regenerate problem clusters from all extracted problems using cosine similarity on embeddings.
          This will delete existing clusters and create new ones, then enrich them with AI-generated summaries.
        </p>

        <div class="flex items-center gap-4">
          <UButton
            label="Regenerate Clusters"
            icon="i-lucide-refresh-cw"
            :loading="generating"
            @click="regenerateClusters"
          />

          <p v-if="generateResult?.success" class="text-sm text-green-600 dark:text-green-400">
            Created {{ generateResult.totalClusters }} clusters from {{ generateResult.totalProblems }} problems.
          </p>
        </div>
      </div>
    </UCard>

    <!-- Mailgun -->
    <UCard>
      <template #header>
        <h2 class="font-semibold">Mailgun Webhook</h2>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Configure Mailgun to forward newsletters to this app automatically.
        </p>

        <div class="space-y-3">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Webhook URL</p>
            <code class="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded block">
              POST https://&lt;your-domain&gt;/api/webhooks/mailgun
            </code>
          </div>

          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Setup Steps</p>
            <ol class="text-sm text-gray-600 dark:text-gray-300 list-decimal list-inside space-y-1">
              <li>Go to Mailgun Dashboard &rarr; Receiving &rarr; Create Route</li>
              <li>Set match expression (e.g. <code class="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">match_recipient("newsletters@yourdomain.com")</code>)</li>
              <li>Set action: forward to the webhook URL above</li>
              <li>Copy your Webhook Signing Key into <code class="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">MAILGUN_WEBHOOK_SIGNING_KEY</code> env var</li>
            </ol>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Environment -->
    <UCard>
      <template #header>
        <h2 class="font-semibold">Environment Variables</h2>
      </template>

      <div class="space-y-2">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Required environment variables (set in <code class="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">.env</code>):
        </p>
        <div class="grid gap-2 text-sm font-mono">
          <div class="flex items-center gap-2">
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">OPENAI_API_KEY</code>
            <span class="text-gray-500 text-xs">GPT-4o analysis + embeddings</span>
          </div>
          <div class="flex items-center gap-2">
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">DATABASE_URL</code>
            <span class="text-gray-500 text-xs">PostgreSQL connection</span>
          </div>
          <div class="flex items-center gap-2">
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">MAILGUN_WEBHOOK_SIGNING_KEY</code>
            <span class="text-gray-500 text-xs">Webhook verification</span>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

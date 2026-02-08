<script setup lang="ts">
const route = useRoute()
const { data: cluster } = await useFetch(`/api/clusters/${route.params.id}`)
</script>

<template>
  <div v-if="cluster" class="space-y-6">
    <!-- Header -->
    <div>
      <NuxtLink to="/" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2 inline-flex items-center gap-1">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        Back to Top Problems
      </NuxtLink>
      <div class="flex items-start justify-between gap-4 mt-2">
        <h1 class="text-2xl font-bold">{{ cluster.clusterName }}</h1>
        <div class="flex items-center gap-2 shrink-0">
          <TrendBadge :trend="cluster.trend" />
          <UBadge variant="subtle" color="neutral">
            {{ cluster.mentionCount }} mention{{ cluster.mentionCount !== 1 ? 's' : '' }}
          </UBadge>
        </div>
      </div>
      <p v-if="cluster.clusterSummary" class="text-gray-600 dark:text-gray-300 mt-2">
        {{ cluster.clusterSummary }}
      </p>
      <div class="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
        <span v-if="cluster.firstSeen">First seen: {{ new Date(cluster.firstSeen).toLocaleDateString() }}</span>
        <span v-if="cluster.lastSeen">Last seen: {{ new Date(cluster.lastSeen).toLocaleDateString() }}</span>
      </div>
    </div>

    <!-- All mentions -->
    <div>
      <h2 class="font-semibold mb-4">All Mentions ({{ cluster.problems?.length || 0 }})</h2>
      <div class="space-y-3">
        <UCard v-for="problem in cluster.problems" :key="problem.id">
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-medium text-sm">{{ problem.problemSummary }}</h3>
              <div class="flex gap-1.5 shrink-0">
                <SeverityBadge :severity="problem.severity" />
                <UBadge variant="subtle" color="neutral">{{ problem.category }}</UBadge>
              </div>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-300">{{ problem.problemDetail }}</p>

            <blockquote
              v-if="problem.originalQuote"
              class="text-xs italic border-l-2 border-gray-300 dark:border-gray-600 pl-3 text-gray-500 dark:text-gray-400"
            >
              "{{ problem.originalQuote }}"
            </blockquote>

            <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <NuxtLink
                v-if="problem.newsletterId"
                :to="`/newsletters/${problem.newsletterId}`"
                class="hover:text-primary-500"
              >
                {{ problem.newsletterSubject || 'View newsletter' }}
              </NuxtLink>
              <span v-if="problem.createdAt">{{ new Date(problem.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

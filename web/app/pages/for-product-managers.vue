<script setup lang="ts">
import { audiencePages, buildAudienceLinks } from '~/data/audiences'

definePageMeta({ layout: false })

const page = audiencePages['product-managers']
const route = useRoute()
const requestURL = useRequestURL()
const canonical = computed(() => new URL(route.path, requestURL.origin).toString())

useSeoMeta({
  title: page.seoTitle,
  description: page.seoDescription,
  ogTitle: page.seoTitle,
  ogDescription: page.seoDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: page.seoTitle,
  twitterDescription: page.seoDescription,
})

useHead({
  link: [{ rel: 'canonical', href: canonical }],
})
</script>

<template>
  <LandingAudienceLandingPage
    :page="page"
    :related-links="buildAudienceLinks(page.slug)"
  />
</template>

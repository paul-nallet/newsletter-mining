<script setup lang="ts">
const container = ref<HTMLElement>()
const isVisible = ref(false)

onMounted(() => {
  if (!container.value) return
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        isVisible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  observer.observe(container.value)
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div
    ref="container"
    class="data-flow mx-auto w-full max-w-3xl py-8"
    :class="{ 'is-visible': isVisible }"
  >
    <div class="flex flex-col items-center gap-4 md:flex-row md:gap-0">
      <!-- Stage 1: Messy emails -->
      <div class="stage stage-input flex-1">
        <div class="stage-visual relative flex h-28 items-center justify-center">
          <div class="envelope envelope-1">
            <UIcon name="i-lucide-mail" class="size-7 text-[var(--ui-text-muted)]" />
          </div>
          <div class="envelope envelope-2">
            <UIcon name="i-lucide-mail" class="size-6 text-[var(--ui-text-muted)]" />
          </div>
          <div class="envelope envelope-3">
            <UIcon name="i-lucide-mail" class="size-8 text-[var(--ui-text-muted)]" />
          </div>
          <div class="envelope envelope-4">
            <UIcon name="i-lucide-mail" class="size-5 text-[var(--ui-text-muted)]" />
          </div>
        </div>
        <p class="mt-2 text-center text-xs font-medium text-[var(--ui-text-muted)]">
          Unread newsletters
        </p>
      </div>

      <!-- Arrow 1 -->
      <div class="arrow-container hidden md:flex items-center px-2">
        <svg width="60" height="20" viewBox="0 0 60 20" class="arrow-svg">
          <line
            x1="0" y1="10" x2="50" y2="10"
            stroke="var(--ui-border)"
            stroke-width="2"
            stroke-dasharray="6 4"
            class="arrow-line"
          />
          <polygon points="48,5 58,10 48,15" fill="var(--ui-text-muted)" class="arrow-head" />
        </svg>
      </div>
      <div class="arrow-container-mobile flex md:hidden items-center justify-center py-1">
        <svg width="20" height="40" viewBox="0 0 20 40" class="arrow-svg">
          <line
            x1="10" y1="0" x2="10" y2="30"
            stroke="var(--ui-border)"
            stroke-width="2"
            stroke-dasharray="6 4"
            class="arrow-line-v"
          />
          <polygon points="5,28 10,38 15,28" fill="var(--ui-text-muted)" class="arrow-head" />
        </svg>
      </div>

      <!-- Stage 2: Processing -->
      <div class="stage stage-process flex-1">
        <div class="stage-visual flex h-28 items-center justify-center">
          <div class="process-box">
            <UIcon name="i-lucide-sparkles" class="size-7 text-[var(--ui-primary)]" />
          </div>
        </div>
        <p class="mt-2 text-center text-xs font-medium text-[var(--ui-text-muted)]">
          AI analysis
        </p>
      </div>

      <!-- Arrow 2 -->
      <div class="arrow-container hidden md:flex items-center px-2">
        <svg width="60" height="20" viewBox="0 0 60 20" class="arrow-svg">
          <line
            x1="0" y1="10" x2="50" y2="10"
            stroke="var(--ui-border)"
            stroke-width="2"
            stroke-dasharray="6 4"
            class="arrow-line"
          />
          <polygon points="48,5 58,10 48,15" fill="var(--ui-text-muted)" class="arrow-head" />
        </svg>
      </div>
      <div class="arrow-container-mobile flex md:hidden items-center justify-center py-1">
        <svg width="20" height="40" viewBox="0 0 20 40" class="arrow-svg">
          <line
            x1="10" y1="0" x2="10" y2="30"
            stroke="var(--ui-border)"
            stroke-width="2"
            stroke-dasharray="6 4"
            class="arrow-line-v"
          />
          <polygon points="5,28 10,38 15,28" fill="var(--ui-text-muted)" class="arrow-head" />
        </svg>
      </div>

      <!-- Stage 3: Organized output -->
      <div class="stage stage-output flex-1">
        <div class="stage-visual flex h-28 items-center justify-center">
          <div class="output-cards">
            <div class="output-card output-card-1">
              <UIcon name="i-lucide-tag" class="size-3.5 text-[var(--ui-primary)]" />
              <span>Pricing gaps</span>
            </div>
            <div class="output-card output-card-2">
              <UIcon name="i-lucide-tag" class="size-3.5 text-[var(--ui-primary)]" />
              <span>Feature requests</span>
            </div>
            <div class="output-card output-card-3">
              <UIcon name="i-lucide-tag" class="size-3.5 text-[var(--ui-primary)]" />
              <span>UX friction</span>
            </div>
          </div>
        </div>
        <p class="mt-2 text-center text-xs font-medium text-[var(--ui-text-muted)]">
          Organized clusters
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Envelopes (messy) --- */
.envelope {
  position: absolute;
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.envelope-1 { transform: translate(-12px, -8px) rotate(-12deg); }
.envelope-2 { transform: translate(14px, 6px) rotate(8deg); }
.envelope-3 { transform: translate(-6px, 10px) rotate(-5deg); }
.envelope-4 { transform: translate(10px, -12px) rotate(15deg); }

.is-visible .envelope {
  opacity: 1;
}

.is-visible .envelope-1 { transition-delay: 0.1s; }
.is-visible .envelope-2 { transition-delay: 0.2s; opacity: 0.7; }
.is-visible .envelope-3 { transition-delay: 0.3s; }
.is-visible .envelope-4 { transition-delay: 0.15s; opacity: 0.5; }

/* --- Processing box --- */
.process-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  border: 2px solid var(--ui-border);
  background: color-mix(in oklab, var(--ui-primary) 6%, var(--ui-bg));
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s;
}

.is-visible .process-box {
  opacity: 1;
  transform: scale(1);
  animation: pulse-glow 2.5s ease-in-out 1s infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--ui-primary) 15%, transparent);
  }
  50% {
    box-shadow: 0 0 16px 4px color-mix(in oklab, var(--ui-primary) 20%, transparent);
  }
}

/* --- Output cards --- */
.output-cards {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.output-card {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  border: 1px solid var(--ui-border);
  background: var(--ui-bg);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--ui-text-highlighted);
  opacity: 0;
  transform: translateX(12px);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.is-visible .output-card-1 { opacity: 1; transform: translateX(0); transition-delay: 0.7s; }
.is-visible .output-card-2 { opacity: 1; transform: translateX(0); transition-delay: 0.85s; }
.is-visible .output-card-3 { opacity: 1; transform: translateX(0); transition-delay: 1s; }

/* --- Arrows --- */
.arrow-line,
.arrow-line-v {
  stroke-dashoffset: 60;
}

.is-visible .arrow-line,
.is-visible .arrow-line-v {
  animation: dash-flow 1.5s linear 0.3s infinite;
}

@keyframes dash-flow {
  to {
    stroke-dashoffset: 0;
  }
}

.arrow-head {
  opacity: 0;
  transition: opacity 0.4s ease 0.5s;
}

.is-visible .arrow-head {
  opacity: 1;
}
</style>

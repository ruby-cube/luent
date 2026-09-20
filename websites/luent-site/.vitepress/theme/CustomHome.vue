<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

type HeroAction = {
  text?: string
  link?: string
  theme?: string
}

type FeatureItem = {
  title?: string
  details?: string
  icon?: string | { src?: string }
}

const { frontmatter } = useData()

const hero = computed(() => (frontmatter.value?.hero ?? {}) as {
  name?: string
  tagline?: string
  actions?: HeroAction[]
})

const heroLead = computed(() => {
  const name = hero.value.name ?? ''
  return name.replace(/\s+and\s+flow\s*$/i, '').trim()
})

const heroAccent = computed(() => 'and flow')

const features = computed(() => (frontmatter.value?.features ?? []) as FeatureItem[])

function iconSrc(icon: FeatureItem['icon']) {
  if (typeof icon === 'string') return icon
  return icon?.src ?? ''
}
</script>

<template>
  <section class="home-shell">
    <section class="home-hero">
      <div class="wrap home-hero-copy">
        <h1>
          {{ heroLead }}
          <span class="accent">{{ heroAccent }}</span>
        </h1>
        <div class="kicker">luent: an expressive framework for web applications</div>
        <div class="hero-actions">
          <a
            v-for="action in hero.actions"
            :key="`${action.text}-${action.link}`"
            class="btn"
            :href="action.link"
            >
            {{ action.text }} <span class="arrow">→</span>
          </a>
          <button class="btn install">
            npm create luent
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
      </div>

      <div class="hero-orb" aria-hidden="true">
        <svg viewBox="0 0 640 640" fill="none">
          <circle cx="320" cy="320" r="140" stroke="var(--vp-c-divider)" stroke-width=".75" />
          <circle cx="320" cy="320" r="225" stroke="var(--vp-c-divider)" stroke-width=".75" />
          <circle cx="320" cy="320" r="310" stroke="var(--vp-c-divider)" stroke-width=".75" />
          <circle cx="314" cy="316" r="14" stroke="var(--vp-c-brand-2)" fill="none" stroke-width=".75" opacity=".3"/>
          <circle cx="326" cy="316" r="14" stroke="var(--vp-c-brand-2)" fill="none" stroke-width=".75" opacity=".3"/>
          <circle cx="320" cy="326" r="14" stroke="var(--vp-c-brand-2)" fill="none" stroke-width=".75" opacity=".3"/>
          <circle cx="419" cy="221" r="7" fill="var(--vp-c-brand-2)" opacity=".30" />
          <circle cx="108.6" cy="397" r="7" fill="var(--vp-c-brand-2)" opacity=".30" />
        </svg>
      </div>
    </section>

    <div class="wrap">
      <section class="home-features">
        <article class="feat" v-for="feature in features" :key="feature.title">
          <img v-if="iconSrc(feature.icon)" class="feat-icon" :src="iconSrc(feature.icon)" alt="" />
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.details }}</p>
        </article>
      </section>
    </div>
  </section>
</template>

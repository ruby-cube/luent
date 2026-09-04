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
        <div class="kicker">an expressive framework for web applications</div>
        <h1>
          {{ heroLead }}
          <span class="accent">{{ heroAccent }}</span>
        </h1>
        <div class="hero-actions">
          <a
            v-for="action in hero.actions"
            :key="`${action.text}-${action.link}`"
            class="btn"
            :href="action.link"
          >
            {{ action.text }} <span class="arrow">→</span>
          </a>
        </div>
      </div>

      <div class="hero-orb" aria-hidden="true">
        <svg viewBox="0 0 640 640" fill="none">
          <circle cx="320" cy="320" r="140" stroke="var(--vp-c-divider)" stroke-width=".75" />
          <circle cx="320" cy="320" r="225" stroke="var(--vp-c-divider)" stroke-width=".75" />
          <circle cx="320" cy="320" r="310" stroke="var(--vp-c-divider)" stroke-width=".75" />
          <circle cx="320" cy="320" r="14" fill="var(--vp-c-brand-2)" style="opacity: .30" />
          <circle cx="419" cy="221" r="7" fill="var(--vp-c-brand-2)" style="opacity: .30" />
          <circle cx="108.6" cy="397" r="7" fill="var(--vp-c-brand-2)" style="opacity: .30" />
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

---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Luent"
  tagline: An expressive framework for building web applications
  image:
    src: /assets/luent-logo-512px.png
    alt: My Logo
  actions:
    # - theme: brand
    #   text: Learn Luent
    #   link: /markdown-examples
    - theme: alt
      text: Take a code tour
      link: /index#code-glimpses

features:
  - title: Develop with fluency
    details: Build with intuitive APIs and expressive syntax designed as natural extensions of native web technologies.
  - title: Take command of reactivity
    details: Gain clarity and control over re-renders through reactivity that is fine-grained, selective, typed, and traceable.
  - title: Manage state natively
    details: Simplify management of structured state through familiar native structures.
---

  <div class='ns-hero-code__header code-glimpse-divider' style='border-bottom: none; width: 5rem; margin-inline: auto'>
    <span class='ns-hero-code__dot'></span>
    <span class='ns-hero-code__dot'></span>
    <span class='ns-hero-code__dot'></span>
  </div>
  <section id='code-glimpses' class="home-glimpses-heading tour-copy">
    <h2>Code Glimpses</h2>
    <p style='text-wrap: balance'><small>Luent applications may be written in <a href='https://www.typescriptlang.org/docs/handbook/jsx.html' target="_blank">TypeScript + JSX</a> (.tsx) or <a href='' target="_blank">NextScript</a> (.ns/.nsx), an extension of TypeScript + JSX.
</small></p>
  </section>

:::luent
code-glimpses
:::

<p class='custom-block status-notice'><strong>This project is in early development.</strong></p>

<style>

.VPHero {
  font-size: 18px;
  padding-bottom: 128px !important;
}

.VPNavBarSearchButton {
  width: 100% !important;
  margin-right: 1rem !important;
}

.VPHero p.tagline {
  text-align: center;
  text-wrap: balance;
  font-size: 28px;
  line-height: 42px;
}

.VPHero h1 {
  font-size: 64px;
  line-height: 72px;
}

.VPHero .actions {
  }

.VPHero .VPButton {
  border-radius: 30px !important;
  padding-inline: 30px !important;
  line-height: 48px !important;
  font-size: 16px !important;
}

.VPHero .container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.VPHero .image {
  order: 1;
  margin: 0 0 1.5rem;
  height: 128px;
  width: 128px;
}

.VPHero .image-container {
  height: 100%;
  width: 100%;
  transform: none;
}

.VPHero .main {
  order: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.VPHero .actions {
  justify-content: center;
}

.VPButton.alt {
  border: 1px solid var(--vp-c-text-2) !important;
  background-color: transparent !important;
}



section#code-glimpses p {
    margin-inline: auto;
  }

p.custom-block.status-notice {
  border: .5px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  text-align: center;
  padding: 1rem;
  margin-top: 6rem;
}

.code-glimpse-divider {
  margin-block: 5rem;
}

.code-glimpse-divider .ns-hero-code__dot {
  border: 1px solid var(--vp-c-brand-1);
}

.home-glimpses-heading {
  width: 100%;
  max-width: 1120px;
  margin: 2.4rem auto 0;
  scroll-margin-top: calc(var(--vp-nav-height) + 20px);
  /* margin: clamp(2.4rem, 5vw, 5rem) auto 0; */
  padding: 0 clamp(0rem, 2vw, 0.4rem) clamp(1rem, 2vw, 1.8rem);
  text-align: center;
}

.home-glimpses-heading h2 {
  margin: 0;
  font-size: clamp(2.1rem, 5vw, 4rem);
  line-height: 1.5em;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  margin-inline: auto;
  padding-top: 0;
  border-top: 0px;
}

@media (max-width: 959px) {
  .home-glimpses-heading {
    margin-top: 2.2rem;
    padding-bottom: 0.7rem;
  }

  .home-glimpses-heading h2 {
    line-height: 1.04;
  }
}
</style>

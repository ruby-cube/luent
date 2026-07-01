---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "NextScript"
  text: "A TypeScript + JSX Language Extension"
  tagline: for writing clear, ergonomic, type-safe code
  actions:
    - theme: brand
      text: Learn NextScript
      link: /guide/getter-syntax.md
    - theme: alt
      text: Code Glimpses
      link: /#code-glimpses

features:
  - title: Ergonomic syntax
    details: Reduce boilerplate code while remaining clear and expressive.
  - title: Language coherence
    details: Write new yet familiar syntax confidently through predictable semantics.
  - title: Improved type safety
    details: Cleanly address type-safety gaps of accessor functions and JSX.
---

  <div class='ns-hero-code__header code-glimpse-divider' style='border-bottom: none; width: 5rem; margin-inline: auto'>
    <span class='ns-hero-code__dot'></span>
    <span class='ns-hero-code__dot'></span>
    <span class='ns-hero-code__dot'></span>
  </div>
  <section id='code-glimpses' class="home-glimpses-heading tour-copy">
    <h2>Code Glimpses</h2>
    <p><small><strong>Note:</strong> Examples use API from <a href="https://github.com/ruby-cube/luent">Luent</a> for demonstration purposes. While NextScript was developed alongside Luent, it is designed to be framework-agnostic.</small></p>
  </section>

  <!-- <div id="home-tour-root"></div> -->

:::luent code-glimpses
:::

<p class='custom-block status-notice'><strong>This project is in early development.</strong></p>

<style scoped>
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
  line-height: 0.98;
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

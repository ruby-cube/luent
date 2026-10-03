---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Build with clarity and flow"
  tagline: An expressive framework for web applications
  actions:
    # - theme: brand
    #   text: Learn Luent
    #   link: /markdown-examples
    # - theme: alt
    #   text: Preview Luent
    #   link: /index#code-glimpses
    - theme: alt
      text: Get a glimpse
      link: /index#code-glimpses

features:
  - icon:
      src: /assets/audio-waveform.svg
      width: 32
      height: 32
    title: Develop with fluency
    details: Build with intuitive APIs and expressive syntax designed as natural extensions of established standards.
  - icon:
      src: /assets/atom.svg
      width: 32
      height: 32
    title: Take command of reactivity
    details: Gain clarity and control over re-renders through traceable, type-explicit, fine-grained reactivity.
  - icon:
      src: /assets/shapes.svg
      width: 32
      height: 32
    title: Manage state natively
    details: Model and update complex state through familiar JavaScript structures and custom classes.
---

  <!-- <div class='ns-hero-code__header code-glimpse-divider' style='border-bottom: none; width: 5rem; margin-inline: auto'>
    <span class='ns-hero-code__dot'></span>
    <span class='ns-hero-code__dot'></span>
    <span class='ns-hero-code__dot'></span>
  </div>

<section id='vision' style='width: 70rem'>
<h2 class='section-heading'>Refining the Framework Experience</h2>
<p class='vision-text'>Modern frameworks have brought powerful innovations to web development. Luent builds on these ideas, exploring ways to reduce cognitive overhead and make application development more intuitive and ergonomic without sacrificing performance, clarity, or scalability.</p>
<p class='vision-text'>Luent is largely implemented, but not yet ready for release. Below is a glimpse of what’s taking shape.</p>
</section> -->
  

  <!-- <div class='ns-hero-code__header code-glimpse-divider' style='border-bottom: none; width: 5rem; margin-inline: auto'>
    <span class='ns-hero-code__dot'></span>
    <span class='ns-hero-code__dot'></span>
    <span class='ns-hero-code__dot'></span>
  </div> -->
  <section id='code-glimpses' class="home-glimpses-heading tour-copy">
    <h2 class='section-heading'>A glimpse of Luent</h2>
  </section>
  <p class='nextscript-note' style='text-wrap: balance'>
    <strong>Note:</strong> <a href='https://github.com/ruby-cube/luent/tree/main/packages/nextscript'>NoriScript (.ns/.nsx)</a> is an extension of TypeScript + JSX that offers improvements in ergonomics and type-safety. It is currently preview-only, not ready for use.
  </p>


:::luent code-glimpses
:::

<!-- <p class='custom-block status-notice'><strong>This project is in early development.</strong></p> -->

<style>

p.nextscript-note {
  color: var(--vp-c-text-2);
  padding-block: 2rem;
  text-align: center;
  margin: 0;
  border-bottom: 1px solid var(--vp-c-divider);
}


.vision {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.vision-text {
  text-wrap: balance; 
  font-size: x-large; 
  line-height: 2.5rem !important;
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
  /* margin: 2.4rem auto 0; */
  scroll-margin-top: calc(var(--vp-nav-height) + 20px);
  /* margin: clamp(2.4rem, 5vw, 5rem) auto 0; */
  padding: 0 clamp(0rem, 2vw, 0.4rem) clamp(1rem, 2vw, 1.8rem);
  text-align: center;
}

h2.section-heading {
  margin: 0;
  font-size: clamp(30px, 5.4vw, 55px);
  line-height: 1.08;
  letter-spacing: -0.015em;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-inline: auto;
  padding-top: 0;
  border-top: 0px;
}

@media (max-width: 959px) {
  .home-glimpses-heading {
    /* margin-top: 2.2rem; */
    padding-bottom: 0.7rem;
  }

  .home-glimpses-heading h2 {
    line-height: 1.04;
  }
}
</style>

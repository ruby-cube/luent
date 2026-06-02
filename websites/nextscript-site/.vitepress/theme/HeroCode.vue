<template>
    <div class='ns-hero-code' aria-label='NextScript example code'>
      <div class='ns-hero-code__header'>
        <span class='ns-hero-code__dot'></span>
        <span class='ns-hero-code__dot'></span>
        <span class='ns-hero-code__dot'></span>
        <span class='ns-hero-code__title'>total.nsx</span>
      </div>
      <pre class='ns-hero-code__body'><code class='ns-hero-code__content'>{{`function Total({ count@ }: { count: Ion<number> }) {
  get qty = ion(0)

  <:component>
    <div>{count@}</div>
    <button on:click={() => qty++}>x {qty@}</button>
    <div>= {(count * qty)@} total</div>
  </:component>
}`}}</code></pre>
    </div>
</template>


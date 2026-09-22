<template>
    <div class='ns-hero-code' aria-label='NextScript example code'>
      <div class='ns-hero-code__header'>
        <span class='ns-hero-code__dot'></span>
        <span class='ns-hero-code__dot'></span>
        <span class='ns-hero-code__dot'></span>
        <span class='ns-hero-code__title'>Counter.nsx</span>
      </div>
      <pre class='ns-hero-code__body'><code class='ns-hero-code__content'>{{`function Counter() {
  get count = ion(0);
  <:>
    <button on:click={(){ count++ \}\}>
      {count@}
    </button>
  </:>
}`}}</code></pre>
    </div>
</template>



import { css, ion, Style, type FromTag, type MutableIon, type RenderTag } from "luent";

export function Counter() {
  const $count = ion(0, {
    increment() { $count.value++ }
  })
  return <>
    <button
      class="count-btn"
      type="button"
      on:click={$count.increment}
    >
      count is {$count}
    </button>
  </>
}

<o-style scope={Counter}>
  {css`
  .count-btn {
    margin-top: .3rem;
    padding: .8rem 2.1rem;
    border-radius: 999px;
    background: var(--btn);
    color: #FFFFFF;
    font-weight: 600;
    font-size: .95rem;
    transition: background .2s
  }

  .count-btn:hover {
    background: var(--btn-hover)
  }
  `}
</o-style>



export function Counter() {
  const $count = ion(0, {
    increment() { $count.value++ }
  })
  return <>
    <button
      class="count-btn luent-scope-8923"
      type="button"
      on:click={$count.increment}
    >
      count is {$count}
    </button>
  </>
}

// Changes
// add luent-scope class
// remove scope property
// add luent-scope modifier to selectors

<o-style>
  {css`
  .count-btn.luent-scope-8923 {
    margin-top: .3rem;
    padding: .8rem 2.1rem;
    border-radius: 999px;
    background: var(--btn);
    color: #FFFFFF;
    font-weight: 600;
    font-size: .95rem;
    transition: background .2s
  }

  .count-btn.luent-scope-8923:hover {
    background: var(--btn-hover)
  }
  `}
</o-style>


export function CodeSectionTabA(setup: FromTag<{
  Slot: RenderTag,
  name: string,
  'mu:sectionTab': MutableIon<string>
}>) {
  const { Slot, name, mu: { $sectionTab } } = setup;
  return <>
    <button
      class={['code-section-tab', { 'active-code-section-tab': () => $sectionTab() === name }]}
      on:click={() => $sectionTab.value = name}
    ><h5><Slot /></h5></button>
    {Style(css`
      .code-section-tab {
        color: var(--vp-c-text-1);
      }
      
      .code-section-tab:hover {
        color: var(--vp-c-brand-2);
      }
      
      .active-code-section-tab {
        color: var(--vp-c-brand-1);
      }
    `)}
  </>
}

type Mu<T> = FromTag<T>

export function CodeSectionTabD(setup: {
  Slot: RenderTag,
  name: string,
  "mu:": Mu<{ sectionTab: MutableIon<string> }>
}) {
  const { Slot, name, "mu:": { $sectionTab } } = setup;
  return <>
    <button
      class={['code-section-tab', { 'active-code-section-tab': () => $sectionTab() === name }]}
      on:click={() => $sectionTab.value = name}
    ><h5><Slot /></h5></button>
    {Style(css`
      .code-section-tab {
        color: var(--vp-c-text-1);
      }
      
      .code-section-tab:hover {
        color: var(--vp-c-brand-2);
      }
      
      .active-code-section-tab {
        color: var(--vp-c-brand-1);
      }
    `)}
  </>
}

export function CodeSectionTabB(setup: FromTag<{
  Slot: RenderTag,
  name: string,
  'wm:sectionTab': MutableIon<string>
  'mu:sectionTab': MutableIon<string>
}>) {
  const { Slot, name, 'mu:sectionTab': $sectionTab } = setup;
  return <>
    <button
      class={['code-section-tab', { 'active-code-section-tab': () => $sectionTab() === name }]}
      on:click={() => $sectionTab.value = name}
    ><h5><Slot /></h5></button>

    {Style(css`
      .code-section-tab {
        color: var(--vp-c-text-1);
      }
      
      .code-section-tab:hover {
        color: var(--vp-c-brand-2);
      }
      
      .active-code-section-tab {
        color: var(--vp-c-brand-1);
      }
    `)}
  </>
}

<CodeSectionTabB
  name='hi'
  om:sectionTab={ion('')}
  mu:sectionTab={ion('')}
></CodeSectionTabB>
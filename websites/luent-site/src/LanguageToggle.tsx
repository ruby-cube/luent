import { css, ion, Style, track } from "@rue/luent"

export function LanguageToggle() {
  const $lang = ion('nsx' as 'nsx' | 'tsx', {
    toggle() {
      $lang.value = $lang() === 'nsx' ? 'tsx' : 'nsx'
    }
  })
  const body = document.querySelector('body')!
  track($lang, () => {
    if ($lang() === 'tsx') {
      body.classList.add('lang-mode-tsx')
    }
    else {
      body.classList.remove('lang-mode-tsx')
    }
  })

  let nsxWidth = 0;

  return <>
    {/* <o--body class={() => `language-${$lang}`} /> */}
    <button class='sidebar toggle' on:click={() => $lang.toggle()}>
      <span class='option selected' style={{ 'transform': () => $lang() === 'tsx' ? `translate(${nsxWidth}px, -1px)` : undefined }}>{() => $lang() === 'nsx' ? 'nsx' : 'tsx'}</span>
      <span after:mount={node => nsxWidth = node.offsetWidth} class='option'>nsx</span>
      <span class='option'>tsx</span>
    </button>
    {Style(css`
.VPSidebarItem .toggle {
  display: flex;
  position: relative;
  align-items: center;
  height: 1.75rem;
  // border: 1px solid var(--vp-c-divider);
  border-radius: 1.5rem;
  padding: 4px;
  z-index: 0;
  background-color: var(--vp-input-switch-bg-color);
  user-select: none;
}

.VPSidebarItem button span {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 19.5px;
  background: transparent;
  color: var(--vp-code-tab-text-color);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  padding: 0px 10px;
  cursor: pointer;
  transform: translateY(-1px);
}

.VPSidebarItem button span.selected {
  position: absolute;
  top: 4px;
  display: inline-flex;
  align-items: center;
  color: transparent;
  background-color: var(--vp-c-neutral-inverse);
  transition: transform .25s;
  z-index: -1;
  line-height: 1.25rem;
}
      `)}
  </>
}
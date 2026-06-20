import { fromTag, As, atAttach, atMount, atUnmount, Await, Case, component, css, Else, ElseIf, If, Match, MaybeIon, Meanwhile, NodeRef, Style, afterMount } from "@rue/luent";
import { Ion, ion, MutableIon } from "@rue/quarky";
import { codeHtml, trusted } from "./code-utils";

// TODO: Fix hacky SSG solutions

export function Code(setup: {
  main: { name: string, code: string, lang?: string },
  alt: { name: string, code: string, lang?: string },
  highlight: (code: string, lang: string) => Promise<string>,
  trusted: boolean
  showSticky?: boolean
  tab?: Ion<'main' | 'alt'> & { toggle(): void }
}) {
  const { main, alt, highlight, trusted, showSticky = false,

    $tab = ion('main' as 'main' | 'alt', {
      toggle() {
        this.value === 'main'
          ? this.value = 'alt'
          : this.value = 'main'
      }
    })
  } = fromTag(setup);


  const $main = ion(codeHtml(main.code), {
    '-fetch': () => highlight(main.code, main.lang ?? main.name)
  })

  let mainWidth = 0;

  const $stickyBtn = NodeRef('button')
  const $container = NodeRef('div')
  const $nav = NodeRef('nav')


  return component(
    <>
      <div class='code-container'>
        <nav ref={$nav}>
          <button class='toggle' on:click={() => $tab.toggle()}>
            <span class='option selected' style={{ 'transform': () => $tab() === 'alt' ? `translateX(${mainWidth}px)` : undefined }}>{() => $tab() === 'main' ? main.name : alt.name}</span>
            <span at:attach={node => mainWidth = node.offsetWidth} class='option'>{main.name}</span>
            <span class='option'>{alt.name}</span>
          </button>
        </nav>
        {If(showSticky, () => {
          const $show = ion(false)

          let containerInView = false;
          let navInView = false;

          atMount(() => {
            const stickyBtn = $stickyBtn()
            const container = $container()
            const nav = $nav()
            if (!stickyBtn || !container || !nav) return;

            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.target === container) containerInView = entry.isIntersecting;
                if (entry.target === nav) navInView = entry.isIntersecting;
              });
              if (containerInView && !navInView) {
                $show.value = true;
              } else {
                $show.value = false;
              }
            }, {
              threshold: 0,
              root: null,
              // This makes the 'out of view' trigger happen 100px before the nav hits the top
              rootMargin: '-75px 0px 0px 0px'
            });

            observer.observe(container);
            observer.observe(nav);

            atUnmount(() => observer.disconnect())
          })
          return <>
            <button show-if={$show} ref={$stickyBtn} class='toggle sticky-btn' on:click={() => $tab.toggle()}>
              <span class='option selected' style={{ 'transform': () => $tab() === 'alt' ? `translateX(${mainWidth}px)` : undefined }}>{() => $tab() === 'main' ? main.name : alt.name}</span>
              <span at:attach={node => mainWidth = node.offsetWidth} class='option'>{main.name}</span>
              <span class='option'>{alt.name}</span>
            </button>
            <div ref={$container} class="sticky-zone">
            </div>
          </>
        })}
        <o:preserve>
          {Await(() => <>
            {If(() => $tab() === 'main', () => {
              return <div class='code'>{{ html: $main, trusted }}</div>
            })}
            {Else(() => {
              const $alt = ion('', {
                '-fetch': () => highlight(alt.code, alt.lang ?? alt.name)
              })
              return <div class='code'>{{ html: $alt, trusted }}</div>
            })}
          </>
          )}
          {Meanwhile(
            <div class='code'>{{ html: $main, trusted }}</div>
          )}
        </o:preserve>
      </div>
      {Style(css`
        .code-container {
          position: relative;
  margin: 16px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background-color: var(--vp-code-block-bg);
  overflow: hidden;
  anchor-name: --code-container;
}

.code-container nav {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 8px;
  background-color: var(--vp-code-tab-bg);
  border-bottom: 1px solid var(--vp-c-divider);
  overflow-x: auto;
}

.code-container .toggle {
  position: relative;
  height: 3rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 1.5rem;
  padding: 4px;
  z-index: 0;
  background-color: var(--vp-input-switch-bg-color);
}

.code-container button span {
  appearance: none;
  height: 39px;
  border: 1px solid transparent;
  border-radius: 19.5px;
  background: transparent;
  color: var(--vp-code-tab-text-color);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  padding: 10px 14px;
  cursor: pointer;
}

.code-container button span.selected {
  position: absolute;
  top: 4px;
  display: inline-flex;
  align-items: center;
  color: transparent;
  background-color: var(--vp-c-neutral-inverse);
  transition: transform .25s;
  z-index: -1;
}

.code-container .shiki {
  margin: 0 !important;
  padding: 20px 24px !important;
  border-radius: 0 !important;
  background-color: transparent !important;
  color: var(--vp-code-block-color);
  overflow-x: auto;
}

.code-container .shiki code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.7;
}

/* .dark .code-container .shiki span {
          color: var(--shiki-dark, inherit);
        }
        
        html:not(.dark) .code-container .shiki span {
          color: var(--shiki-light, inherit);
        } */

@media (max-width: 639px) {
  .code-container {
    border-radius: 10px;
  }

  .code-container nav {
    padding: 6px;
  }

  .code-container nav button {
    font-size: 13px;
    padding: 9px 12px;
  }

  .code-container .shiki {
    padding: 16px !important;
  }
}

.sticky-btn {
  position: fixed !important;
  top: calc(var(--vp-nav-height) + .5rem);
  /* Reset left if previously set */
  left: auto;
  right: anchor(--code-container right);
  margin-right: 0.5rem;

  z-index: 1000 !important;
  transition: opacity 0.3s ease; /* Smooth fade-in/out */
}


.sticky-zone {
  position: absolute;
  inset: 0px;
  bottom: 4rem;
  top: 4rem;
}

      `)}
    </>
  )
}
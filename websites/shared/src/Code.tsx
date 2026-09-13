import { Ion, ion, atMount, atUnmount, Await, css, Else, If, Meanwhile, NodeRef, Style, FromTag, afterAttach, queueLayout, listen, queueTask, WithRef, awaitTick } from "luent";
import { codeHtml, trusted } from "./code-utils";
import { TOOLTIP_CONFIG, TooltipKit } from "@luent/luent-ui";
import { HoverInfo } from "./HoverInfo";

// TODO: Fix hacky SSG solutions

function encodeHover(variable: string) {
  return variable[0] + 'æ' + variable.slice(1)
}

function decode(code: string) {
  return code
    .replaceAll('æ', '')
    .replaceAll("data-hover-id='$", "data-hover-id='ß") // dollar signs cause trouble in css selectors, so we must get rid of them
}

function markHover(code: string, map?: { [key: string]: string }) {
  if (!map) return code;
  for (const key in map) {
    const [variable] = key.split('_')
    code = code.replace(variable, `<span data-hover-id='${encodeHover(key)}'>${encodeHover(variable)}</span>`)
  }
  return decode(code);
}

type CodeTab = {
  name: string,
  code: string,
  lang?: string,
  hover?: { [key: string]: string }
}

export function $CodeTab() {
  return ion('main' as 'main' | 'alt', {
    toggle() {
      this.value === 'main'
        ? this.value = 'alt'
        : this.value = 'main'
    }
  })
}

export function Code(setup: FromTag<{
  main: CodeTab,
  alt: CodeTab,
  filename?: string,
  highlight: (code: string, lang: string) => Promise<string>,
  trusted: boolean
  showSticky?: boolean
  tab?: Ion<'main' | 'alt'> & { toggle(): void }
}>) {
  const { main, alt, highlight, trusted, filename = 'example', showSticky = false,
    $tab = $CodeTab()
  } = setup;

  const $stickyBtn = NodeRef('button')
  const $container = NodeRef('div')
  const $nav = NodeRef('nav')




  return <>
    <div class='code-container'>
      <nav ref={$nav}>
        {filename ?
          <span class='filename'>{filename}.{() => $tab() === 'main' ? main.name : alt.name}</span>
          : <span></span>
        }
        <CodeToggle tab={$tab} main={main.name} alt={alt.name} />
      </nav>
      {If(showSticky, () => {
        const $show = ion(false)

        let containerInView = false;
        let navInView = false;

        atMount(() => {
          const stickyButton = $stickyBtn()
          const stickyContainer = $container()
          const nav = $nav()
          if (!stickyButton || !stickyContainer || !nav) return;

          function updateStickyPlacement() {
            if (!stickyButton || !stickyContainer) return
            const containerRect = stickyContainer.getBoundingClientRect()
            const rightOffset = Math.max(0, window.innerWidth - containerRect.right + 8)
            stickyButton.style.right = `${rightOffset}px`
          }

          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.target === stickyContainer) containerInView = entry.isIntersecting;
              if (entry.target === nav) navInView = entry.isIntersecting;
            });
            if (containerInView && !navInView) {
              $show.value = true;
              updateStickyPlacement()
            } else {
              $show.value = false;
            }
          }, {
            threshold: 0,
            root: null,
            // This makes the 'out of view' trigger happen 100px before the nav hits the top
            rootMargin: '-75px 0px 0px 0px'
          });

          observer.observe(stickyContainer);
          observer.observe(nav);

          updateStickyPlacement()
          listen(window, 'resize', updateStickyPlacement, { passive: true })
          listen(window, 'scroll', updateStickyPlacement, { passive: true })

          atUnmount(() => {
            observer.disconnect()
          })
        })
        return <>
          <CodeToggle
            display-if={$show}
            tab={$tab}
            ref={$stickyBtn}
            class='sticky-btn'
            main={main.name}
            alt={alt.name}
          />
          <div ref={$container} class="sticky-zone"></div>
        </>
      })}
      {/* <o:preserve> */}
      {Await(() => <>
        {If(() => $tab() === 'main', () =>
          CodeBlock(main, highlight)
          // <div class='code'>{{ html: codeHtml(main.code), trusted }}</div>
        )}
        {Else(() =>
          CodeBlock(alt, highlight)
          // <div class='code'>{{ html: codeHtml(alt.code), trusted }}</div>
        )}
      </>)}
      {Meanwhile(() => {
        console.log('$$$ meanwhile...')
        return <div class='code'>{{ html: codeHtml(main.code), trusted }}</div>
      })}

      {/* </o:preserve> */}
    </div>
    {Style(css`
        .code-container {
          position: relative;
          margin: 16px 0;
          // border: 1px solid var(--vp-c-divider);
          border-radius: 12px;
          background-color: var(--vp-code-block-bg);
          overflow: hidden;
        }

        .code-container nav {
          display: flex;
          justify-content: space-between;
          padding: 8px 8px 8px 24px;
          background-color: var(--vp-code-tab-bg);
          overflow-x: auto;
        }

        .code-container .filename {
          font-family: var(--default-mono-font-family);
          font-size: 11.5px;
          color: #6c6f78;
          letter-spacing: .05em;
          margin-block: auto;
        }

        .code-container .shiki {
          margin: 0 !important;
          padding: 10px 20px 24px 24px !important;
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
            padding: 6px 6px 6px 16px;
          }

          .code-container nav button {
            font-size: 13px;
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
          right: .5rem;
          margin-right: 0;
          z-index: 1000 !important;
        }

        .sticky-zone {
          position: absolute;
          inset: 0px;
          bottom: 4rem;
          top: 4rem;
          pointer-events: none;
        }

      `)}
  </>
}

function CodeBlock(tab: CodeTab, highlight: (code: string, lang: string) => Promise<string>) {
  const $code = ion('', {
    '-fetch': async () => {
      const highlighted = await highlight(tab.code, tab.lang ?? tab.name)
      return markHover(highlighted, tab.hover)
    },
    '-awaited': true
  })
  const $container = NodeRef('div')

  return <>
    <o:context provide={TOOLTIP_CONFIG({ delay: 500, hideDelay: 500 })}>
      <div ref={$container} class='code'>{{ html: $code, trusted }}</div>
      {If(tab.hover, () => {
        const hoverMap = removeDollarSigns(tab.hover!)
        const { tooltip, setTooltipTrigger } = TooltipKit({
          info: hoverMap,
          container: $container
        })
        afterAttach(() => {
          for (const key in hoverMap) {
            const node = document.querySelector(`[data-hover-id="${key}"]`)
            if (node)
              setTooltipTrigger[key](node)
          }
        })
        return <>
          <HoverInfo tooltip={tooltip} place="above" align="start">
            <span>{() => tooltip.info}</span>
          </HoverInfo>
        </>
      })}
    </o:context>
  </>
}

function removeDollarSigns(map: { [key: string]: string }) {
  const safeMap = Object.create(null)
  for (const key in map) {
    safeMap[key.replaceAll('$', 'ß')] = map[key]
  }
  return safeMap
}

export function CodeToggle(setup: FromTag<{
  tab: Ion<'main' | 'alt'> & { toggle(): void },
  main: string,
  alt: string
}> & WithRef<'button'>) {
  const { $tab, main, alt, ...rest } = setup;
  let mainWidth = 0;

  const $mainNode = NodeRef('span')
  const $knob = NodeRef('span')
  const $toggling = ion(false)

  function transitionToggle(node: HTMLElement | undefined) {
    if (!node) {
      return;
    }
    if (mainWidth === 0) {
      queueLayout(() => {
        mainWidth = $mainNode()!.offsetWidth;
      })
    }
    $toggling.value = true;
    listen(node, 'transitionend', () => {
      $toggling.value = false;
    })
  }

  return <>
    <button
      auto-bind={rest}
      class='code-toggle'
      on:click={() => { transitionToggle($knob()); awaitTick(() => $tab.toggle()) }}
    >
      <span
        display-if={$toggling}
        ref={$knob}
        class='option selected'
        style={{
          'transform': () => $tab() === 'alt' ? `translateX(${mainWidth}px)` : undefined
        }}
      >
        {() => $tab() === 'main' ? main : alt}
      </span>
      <span class={['option', { 'active': () => !$toggling() && $tab() === 'main' }]}
        ref={$mainNode}
      >
        {main}
      </span>
      <span class={['option', { 'active': () => !$toggling() && $tab() === 'alt' }]}>
        {alt}
      </span>
    </button>

    {Style(css`
      .code-toggle {
        position: relative;
        border-radius: 1.5rem;
        z-index: 0;
        background-color: var(--vp-input-switch-bg-color);
      }

      .code-toggle span {
        display: inline-block;
        appearance: none;
        border: 1px solid transparent;
        border-radius: 19.5px;
        background: transparent;
        color: var(--vp-code-tab-text-color);
        font-size: 12px;
        font-weight: 500;
        line-height: 1.5em;
        white-space: nowrap;
        padding: 6px 10px;
        cursor: pointer;
      }

      .code-toggle span.selected {
        position: absolute;
        display: inline-flex;
        align-items: center;
        color: transparent;
        background-color: var(--vp-c-neutral-inverse);
        transition: transform .15s;
        z-index: -1;
      }

      @media (prefers-reduced-motion: reduce) {
        .code-toggle span.selected {
          transition-property: transform !important;
          transition-duration: 0.15s !important;
          transition-delay: 0s !important;
        }
      }

      .code-toggle span.active {
        background-color: var(--vp-c-neutral-inverse);
      }

      @media (max-width: 639px) {
        .code-toggle {
          font-size: 13px;
        }
      } 
    `)}
  </>
}
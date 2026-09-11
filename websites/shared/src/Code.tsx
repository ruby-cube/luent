import { Ion, ion, atMount, atUnmount, Await, css, Else, If, Meanwhile, NodeRef, Style, FromTag, afterAttach, awaiting, component, queueLayout } from "luent";
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
  TabName?: () => any,
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

  let mainWidth = 0;

  function setMainWidth(node: HTMLSpanElement) {
    queueLayout(() => {
      mainWidth = node.offsetWidth;
    })
  }

  const $stickyBtn = NodeRef('button')
  const $container = NodeRef('div')
  const $nav = NodeRef('nav')

  return {
    component: {
      get tab() { return $tab() }
    },
    nodes: <>
      <div class='code-container'>
        <nav ref={$nav}>
          {filename ?
            <span class='filename'>{filename}.{() => $tab() === 'main' ? main.name : alt.name}</span>
            : <span></span>
          }
          <button class='toggle' on:click={() => { console.log('$$$click toggle'); $tab.toggle() }}>
            <span class='option selected' style={{ 'transform': () => $tab() === 'alt' ? `translateX(${mainWidth}px)` : undefined }}>
              {If(() => $tab() === 'main',
                <>{main.name}</>
              )}
              {Else('preserve',
                <>{alt.TabName ? alt.TabName() : alt.name}</>
              )}
            </span>
            <span after:mount={setMainWidth} class='option'>{main.name}</span>
            <span class='option'>
              <>{alt.TabName ? alt.TabName() : alt.name}</>
            </span>
            {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-question-mark"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg> */}
          </button>
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
            window.addEventListener('resize', updateStickyPlacement, { passive: true })
            window.addEventListener('scroll', updateStickyPlacement, { passive: true })

            atUnmount(() => {
              observer.disconnect()
              window.removeEventListener('resize', updateStickyPlacement)
              window.removeEventListener('scroll', updateStickyPlacement)
            })
          })
          return <>
            <button display-if={$show} ref={$stickyBtn} class='toggle sticky-btn' on:click={() => $tab.toggle()}>
              <span class='option selected' style={{ 'transform': () => $tab() === 'alt' ? `translateX(${mainWidth}px)` : undefined }}>{() => $tab() === 'main' ? main.name : alt.name}</span>
              <span at:attach={node => mainWidth = node.offsetWidth} class='option'>{main.name}</span>
              <span class='option'>{alt.name}</span>
            </button>
            <div ref={$container} class="sticky-zone">
            </div>
          </>
        })}
        {/* <o:preserve> */}
        {Await(() => <>
          {If(() => $tab() === 'main', () =>
            CodeBlock(main, highlight)
          )}
          {Else(() =>
            CodeBlock(alt, highlight)
          )}
        </>)}
        {Meanwhile(
          <div class='code'>{{ html: codeHtml(main.code), trusted }}</div>
        )}
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

        .code-container .toggle {
          position: relative;
          height: 2.5rem;
          border-radius: 1.5rem;
          padding: 4px;
          z-index: 0;
          background-color: var(--vp-input-switch-bg-color);
        }

        .code-container .filename {
          font-family: var(--default-mono-font-family);
          font-size: 11.5px;
          color: #6c6f78;
          letter-spacing: .05em;
          margin-block: auto;
        }

        .code-container button span {
          appearance: none;
          border: 1px solid transparent;
          border-radius: 19.5px;
          background: transparent;
          color: var(--vp-code-tab-text-color);
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          padding: 3px 10px;
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
          padding: 0px 20px 24px 24px !important;
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
          right: .5rem;
          margin-right: 0;

          z-index: 1000 !important;
          transition: opacity 0.3s ease; /* Smooth fade-in/out */
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
}

function CodeBlock(tab: CodeTab, highlight: (code: string, lang: string) => Promise<string>) {
  const $code = ion('', {
    '-fetch': async () => {
      const highlighted = await highlight(tab.code, tab.lang ?? tab.name)
      return markHover(highlighted, tab.hover)
    }
  })
  const $container = NodeRef('div')

  return <>
    <o:context provide={TOOLTIP_CONFIG({ delay: 500, hideDelay: 500 })}>
      <div ref={$container} class='code'>{{ html: $code, trusted }}</div>
      {Await($code, () => <>
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
              <span>{() => (tooltip.info)}</span>
            </HoverInfo>
          </>
        })}
      </>)}
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
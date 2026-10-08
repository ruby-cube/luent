import { Ion, ion, atMount, atUnmount, Await, css, Else, If, Meanwhile, NodeRef, Style, FromTag, afterAttach, awaitLayout, listen, awaitTick, queueTask, awaiting, awaitRender, Bindings } from "luent";
import { codeHtml, trusted } from "./code-utils";
import { TOOLTIP_CONFIG, TooltipKit } from "@luent/luent-ui";
import { HoverInfo } from "./HoverInfo";

// TODO: Fix hacky SSG solutions

function encodeHover(variable: string) {
  return variable[0] + 'æ' + variable.slice(1)
}

function decode(code: string) {
  console.log('decode hover')
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
  const $container = NodeRef('div') as unknown as NodeRef<HTMLDivElement>
  const $nav = NodeRef('nav') as unknown as NodeRef<HTMLElement>
  const $showSticky = ion(false)

  return <>
    <div class='code-container'>
      <nav ref={$nav}>
        {filename ?
          <span class='filename'>{filename}.{() => $tab() === 'main' ? main.lang ?? main.name : alt.lang ?? alt.name}</span>
          : <span></span>
        }
        <CodeToggle
          tab={$tab}
          main={main.name}
          alt={alt.name}
          style={{
            visibility: () => $showSticky() ? 'hidden' : 'visible',
            pointerEvents: () => $showSticky() ? 'none' : 'auto'
          }}
          aria-hidden={() => $showSticky() ? 'true' : 'false'}
        />
      </nav>
      {If(showSticky, () => {
        atMount(() => {
          const stickyButton = $stickyBtn() as unknown as HTMLDivElement
          const stickyContainer = $container() as unknown as HTMLDivElement
          const nav = $nav() as unknown as HTMLElement
          if (!stickyButton || !stickyContainer || !nav) return;

          function updateStickyPlacement() {
            if (!stickyButton || !stickyContainer) return
            awaitLayout(() => {
              const containerRect = stickyContainer.getBoundingClientRect()
              const rightOffset = Math.max(0, window.innerWidth - containerRect.right + 8)
              awaitRender(() => {
                stickyButton.style.right = `${rightOffset}px`
              })
            })
          }

          function isLocalNavShown() {
            const localNav = document.querySelector('.VPLocalNav')
            if (!(localNav instanceof HTMLElement)) return false
            const style = window.getComputedStyle(localNav)
            if (style.display === 'none' || style.visibility === 'hidden') return false
            const rect = localNav.getBoundingClientRect()
            return rect.height > 0 && rect.width > 0
          }

          let stickyVisible = false
          const CONTAINER_BOTTOM_OFFSET_PX = 8

          function stickyTopOffset() {
            // Match the rootMargin behavior that depended on mobile local nav visibility.
            return isLocalNavShown() ? 160 : 120
          }

          function updateStickyVisibility(nextVisible: boolean) {
            if (nextVisible === stickyVisible) return
            stickyVisible = nextVisible
            $showSticky.value = nextVisible
            if (nextVisible) {
              updateStickyPlacement()
            }
          }

          function syncStickyVisibility() {
            awaitLayout(() => {
              const navRect = nav.getBoundingClientRect()
              const containerRect = stickyContainer.getBoundingClientRect()
              const topOffset = stickyTopOffset()
              const shouldShow = navRect.bottom <= topOffset
                && containerRect.bottom > topOffset + CONTAINER_BOTTOM_OFFSET_PX

              awaitRender(() => {
                updateStickyVisibility(shouldShow)
              })
            })
          }
          syncStickyVisibility()

          listen(window, 'scroll', () => {
            syncStickyVisibility()
          }, { passive: true })

          listen(window, 'resize', () => {
            updateStickyPlacement()
            syncStickyVisibility()
          }, { passive: true })

          atUnmount(() => {
            stickyVisible = false
            $showSticky.value = false
          })
        })

        return <>
          <CodeToggle
            display-if={$showSticky}
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
        {If(() => $tab() === 'main',
          <CodeBlock tab={main} highlight={highlight} />
        )}
        {Else(
          <CodeBlock tab={alt} highlight={highlight} />
        )}
      </>)}
      {Meanwhile(
        <div class='code'>{{ html: codeHtml(main.code), trusted }}</div>
      )}

      {/* </o:preserve> */}
    </div>
    {Style(css`
        .code-container .code {
          line-height: 1rem;
        }

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
          color: var(--vp-c-text-3);
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

        @media (max-width: 959px) {
          .sticky-btn {
            top: calc(var(--vp-nav-height) + 47px + .5rem);
          }
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

function CodeBlock(setup: FromTag<{ tab: CodeTab, highlight: (code: string, lang: string) => Promise<string> }>) {
  const { tab, highlight } = setup
  const $code = ion('', {
    '-fetch': async () => {
      const highlighted = await highlight(tab.code, tab.lang ?? tab.name)
      return markHover(highlighted, tab.hover)
    }
  })
  const $container = NodeRef('div') as unknown as NodeRef<HTMLDivElement>

  const delay = useDelay()

  return <>
    <o:context map={TOOLTIP_CONFIG({ delay, hideDelay: delay })}>
      <div ref={$container} class='code'>{{ html: $code, trusted }}</div>
      {Await($code, <>
        {If(tab.hover, () => {
          const hoverMap = removeDollarSigns(tab.hover!)
          const { tooltip, setTooltipTrigger } = TooltipKit({
            info: hoverMap,
            container: $container
          })
          afterAttach(() => {
            for (const key in hoverMap) {
              const node = document.querySelector(`[data-hover-id="${key}"]`) as HTMLElement
              if (node) {
                setTooltipTrigger[key](node)
              }
              else {
                // Timing is tricky on first load :(
                awaiting($code, () => {
                  awaitTick(() => {
                    setTooltipTrigger[key](document.querySelector(`[data-hover-id="${key}"]`)!)
                  })
                })
              }
            }
          })
          return <>
            <HoverInfo tooltip={tooltip} place="above" align="start">
              <span>{() => tooltip.info}</span>
            </HoverInfo>
          </>
        })}
      </>
      )}
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
}> & Bindings<'button'>) {
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
      awaitLayout(() => {
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
        // background-color: var(--vp-c-bg);
        border: 1px solid var(--vp-c-divider);
        background-color: var(--vp-input-switch-bg-color);
      }

      .code-toggle span {
        display: inline-block;
        appearance: none;
        border: 1px solid transparent;
        border-radius: 19.5px;
        background: transparent;
        // color: var(--vp-code-tab-text-color);
        color: var(--vp-c-text-2);
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

      .code-toggle span.active {
        background-color: var(--vp-c-neutral-inverse);
      }

      @layer __vitepress_base {
        @media (prefers-reduced-motion: reduce) {
          .code-toggle span.selected {
            transition-property: transform !important;
            transition-duration: .15s !important;
            transition-delay: 0s !important;
          }
        }
      }

      @media (max-width: 639px) {
        .code-toggle {
          font-size: 13px;
        }
      } 
    `)}
  </>
}

function detectTouchscreen() {
  let hasTouch = false;

  if (window.PointerEvent && ('maxTouchPoints' in navigator)) {
    if (navigator.maxTouchPoints > 0) {
      hasTouch = true;
    }
  } else {
    if (window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches) {
      hasTouch = true;
    } else if (window.TouchEvent || ('ontouchstart' in window)) {
      hasTouch = true;
    }
  }

  return hasTouch;
}

function useDelay() {
  const touchscreen = detectTouchscreen();
  if (touchscreen) return 0;
  return 500
}
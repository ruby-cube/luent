import { As, Await, Case, component, css, Else, ElseIf, If, Match, MaybeIon, Meanwhile, Style } from "@rue/luent";
import { ion } from "@rue/quarky";
import { codeHtml, trusted } from "./code-utils";

// TODO: Fix hacky SSG solutions

export function Code(setup: {
  main: { name: string, code: string, lang?: string },
  alt: { name: string, code: string, lang?: string },
  highlight: (code: string, lang: string) => Promise<string>,
  trusted: boolean
}) {
  const { main, alt, highlight, trusted } = setup;

  const $tab = ion('main' as 'main' | 'alt', {
    toggle() {
      $tab() === 'main'
        ? $tab.value = 'alt'
        : $tab.value = 'main'
    }
  })
  const $main = ion(codeHtml(main.code), {
    '-fetch': () => highlight(main.code, main.lang ?? main.name)
  })

  let mainWidth = 0;

  function renderClient() {
    return <remount-view>
      {Await(() => <>
        {If(() => $tab() === 'main', () => {
          return <div innerHTML={{ html: $main, trusted }}></div>
        })}
        {Else(() => {
          const $alt = ion('', {
            '-fetch': () => highlight(alt.code, alt.lang ?? alt.name)
          })
          return <div innerHTML={{ html: $alt, trusted }}></div>
        })}
      </>
      )}
      {Meanwhile(
        <div innerHTML={{ html: $main, trusted }}></div>
      )}
    </remount-view>
  }

  return component(
    <>
      <div class='code-container'>
        <nav>
          <button class='toggle' on:click={() => $tab.toggle()}>
            <span class='option selected' style={{ 'transform': () => $tab() === 'alt' ? `translateX(${mainWidth}px)` : undefined }}>{() => $tab() === 'main' ? main.name : alt.name}</span>
            <span at:mount={node => mainWidth = node.offsetWidth} class='option'>{main.name}</span>
            <span class='option'>{alt.name}</span>
          </button>
        </nav>
        {import.meta.env.SSR ? <div innerHTML={{ html: $main, trusted }}></div> : renderClient()}
      </div>
    </>
  )
}
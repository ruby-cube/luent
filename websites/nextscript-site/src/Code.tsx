import { As, Await, Case, component, css, Else, ElseIf, FromTag, If, Match, MaybeIon, Style } from "@rue/luent";
import { ion, watch } from "@rue/quarky";
import { createHighlighter } from 'shiki'
import nsxGetInjectionGrammar from '../../../plugins/vscode-nextscript/grammar/nsx-get.injection.tmLanguage.json'
// Dim Fire themes by ahme.dev (MIT): https://github.com/ahme-dev/dimfire
import dimFireDay from './themes/dim-fire-day.json'
import dimFireDusk from './themes/dim-fire-dusk.json'

const tokenColors = [{
  scope: [
    "punctuation.section.embedded.begin.tsx",
    "punctuation.section.embedded.end.tsx",
    "punctuation.section.embedded.begin.jsx",
    "punctuation.section.embedded.end.jsx",
  ],
  settings: {
    foreground: "#A6ACCDC0"
  }
},
{
  scope: [
    "meta.embedded.expression meta.brace.round",
    "meta.arrow punctuation.definition.parameters"
  ],
  settings: {
    foreground: "#A6ACCDC0"
  }
},
{
  scope: [
    "keyword.operator.at",
  ],
  settings: {
    foreground: "#A6ACCDC0"
  }
}
]

const dimFireDayCustom = {
  ...dimFireDay,
  name: 'dim-fire-day-custom',
  tokenColors: [
    ...(dimFireDay.tokenColors ?? []),
    // ...tokenColors
  ]
}

const dimFireDuskCustom = {
  ...dimFireDusk,
  name: 'dim-fire-dusk-custom',
  tokenColors: [
    ...(dimFireDusk.tokenColors ?? []),
    // ...tokenColors
  ]
}

const nsxGetPatterns = (nsxGetInjectionGrammar.patterns ?? []).map(pattern => ({
  ...pattern
}))

const nsxGrammar = {
  name: 'nsx',
  scopeName: 'source.nsx',
  aliases: ['ns'],
  patterns: [
    { include: 'source.tsx' }
  ],
  repository: {},
  injections: {
    'L:source.nsx -comment -string': {
      patterns: nsxGetPatterns
    }
  }
}

const highlighterPromise = createHighlighter({
  themes: [dimFireDayCustom, dimFireDuskCustom],
  langs: ['tsx', nsxGrammar]
})

async function renderCodeToHtml(code: string, lang: 'nsx' | 'tsx') {
  const highlighter = await highlighterPromise
  return highlighter.codeToHtml(code, {
    lang,
    themes: {
      light: 'dim-fire-day-custom',
      dark: 'dim-fire-dusk-custom'
    },
    defaultColor: false
  })
}

function toHtml(code: string) {
  return code
    .replace(/&/g, '&#x26;')
    .replace(/</g, '&#x3C;')
    .replace(/>/g, '&#x3E;')
}

function codeHtml(code: string) {
  return `<pre class='shiki'><code>${toHtml(code)}</code></pre>`
}

function unwrapShikiCode(html: string) {
  const match = html.match(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/)
  return match?.[1] ?? html
}

export function Code(setup: FromTag<{
  nsx: string,
  tsx: string,
  transpiled: string,
}>) {
  const { nsx, tsx, transpiled } = setup
  const $tab = ion('nsx' as 'nsx' | 'tsx' | 'output')
  const $nsx = ion(codeHtml(nsx), {
    '-fetch': () => renderCodeToHtml(nsx, 'nsx')
  })

  return component(
    <>
      <div class='code-container'>
        <nav>
          <button class={{ 'selected': () => $tab.value === 'nsx' }} on:click={() => $tab.value = 'nsx'}>nsx</button>
          <button class={{ 'selected': () => $tab.value === 'output' }} on:click={() => $tab.value = 'output'}>output</button>
          {/* <button class={{ 'selected': () => $tab.value === 'tsx' }} on:click={() => $tab.value = 'tsx'}>tsx</button> */}
        </nav>
        <remount-view>
          {Await(() => <>
            {If(() => $tab() === 'nsx', () => {
              return <div innerHTML={trusted($nsx)}></div>
            })}
            {/* {ElseIf(() => $tab() === 'tsx', () => {
              const $tsx = ion('', {
                '-fetch': () => renderCodeToHtml(tsx, 'tsx')
              })
              return <div innerHTML={trusted($tsx)}></div>
            })} */}
            {Else(() => {
              const $transpiled = ion('', {
                '-fetch': () => renderCodeToHtml(transpiled, 'tsx')
              })
              return <div innerHTML={trusted($transpiled)}></div>
            })}
          </>
          )}
        </remount-view>
      </div>

      {Style(css`
        .code-container {
          margin: 16px 0;
          border: 1px solid var(--vp-c-divider);
          border-radius: 12px;
          background-color: var(--vp-code-block-bg);
          overflow: hidden;
        }

        .code-container nav {
          position: relative;
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 8px;
          background-color: var(--vp-code-tab-bg);
          border-bottom: 1px solid var(--vp-c-divider);
          overflow-x: auto;
        }

        .code-container nav button {
          appearance: none;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          color: var(--vp-code-tab-text-color);
          font-size: 14px;
          font-weight: 500;
          line-height: 1;
          white-space: nowrap;
          padding: 10px 14px;
          cursor: pointer;
          transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
        }

        .code-container nav button:hover {
          color: var(--vp-code-tab-hover-text-color);
          background-color: var(--vp-c-default-soft);
        }

        .code-container nav button.selected {
          color: var(--vp-code-tab-active-text-color);
          background-color: var(--vp-c-neutral-inverse);
          border-color: var(--vp-c-divider);
        }

        .code-container remount-view {
          display: block;
          background-color: var(--vp-code-block-bg);
        }

        .code-container remount-view > div {
          margin: 0;
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
        
        // .dark .code-container .shiki span {
        //   color: var(--shiki-dark, inherit);
        // }
        
        // html:not(.dark) .code-container .shiki span {
        //   color: var(--shiki-light, inherit);
        // }

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
      `)}
    </>
  )
}

export function trusted(html: MaybeIon<string>) {
  return {
    trusted: true,
    html
  }
}
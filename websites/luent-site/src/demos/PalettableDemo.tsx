import { Code, DemoContainer, Palettable } from '@rue/websites-shared'
import { highlightCode } from "../highlighter"
import { ion } from '@rue/quarky'

export function PalettableDemo() {
  const $tab = ion('main' as 'main' | 'alt', {
    toggle() {
      this.value === 'main'
        ? this.value = 'alt'
        : this.value = 'main'
    }
  })

  return (
    <>
      <DemoContainer style='padding: 0; height: 460px'>
        {Palettable()}
      </DemoContainer>
      <Code
        trusted
        main={{ name: 'nsx', code: Palettable.nsx }}
        alt={{ name: 'tsx', code: Palettable.tsx, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      {/* <Code
        trusted
        main={{ name: 'nsx', code: Palettable.nsxPowerset }}
        alt={{ name: 'tsx', code: Palettable.tsxPowerset, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        main={{ name: 'nsx', code: Palettable.nsxMessages }}
        alt={{ name: 'tsx', code: Palettable.tsxMessages, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        main={{ name: 'nsx', code: EmojiQuest.nsxPanel }}
        alt={{ name: 'tsx', code: EmojiQuest.tsxPanel, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      /> */}
      {/* <Code
        trusted
        main={{ name: 'nsx', code: nsxPanel }}
        alt={{ name: 'tsx', code: tsxPanel, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        main={{ name: 'nsx', code: nsx }}
        alt={{ name: 'tsx', code: tsx, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      /> */}
    </>
  )
}

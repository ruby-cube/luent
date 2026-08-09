import { Code, DemoContainer, EmojiQuest } from '@luent/websites-shared'
import { highlightCode } from "../highlighter"
import { ion } from 'luent'

export function EmojiQuestDemo() {
  const $tab = ion('main' as 'main' | 'alt', {
    toggle() {
      this.value === 'main'
        ? this.value = 'alt'
        : this.value = 'main'
    }
  })
  
  return (
    <>
      <DemoContainer style='height: 460px'>
        {EmojiQuest()}
      </DemoContainer>
      <Code
        trusted
        main={{ name: 'nsx', code: EmojiQuest.nsx }}
        alt={{ name: 'tsx', code: EmojiQuest.tsx, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        main={{ name: 'nsx', code: EmojiQuest.nsxPowerset }}
        alt={{ name: 'tsx', code: EmojiQuest.tsxPowerset, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        main={{ name: 'nsx', code: EmojiQuest.nsxMessages }}
        alt={{ name: 'tsx', code: EmojiQuest.tsxMessages, lang: 'tsx' }}
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
      />
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

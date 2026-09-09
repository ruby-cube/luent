import { $CodeTab, Code, DemoContainer, EmojiQuest } from '@luent/websites-shared'
import { highlightCode } from "../highlighter"

export function EmojiQuestDemo() {
  const $tab = $CodeTab()
  
  return (
    <>
      <DemoContainer style='height: 468px; padding: 28px'>
        {EmojiQuest()}
      </DemoContainer>
      <Code
        trusted
        filename='EmojiQuest'
        main={{ name: 'nsx', code: EmojiQuest.nsx }}
        alt={{ name: 'tsx', code: EmojiQuest.tsx, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        filename='EmojiQuest'
        main={{ name: 'nsx', code: EmojiQuest.nsxPowerset }}
        alt={{ name: 'tsx', code: EmojiQuest.tsxPowerset, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        filename='EmojiQuest'
        main={{ name: 'nsx', code: EmojiQuest.nsxMessages }}
        alt={{ name: 'tsx', code: EmojiQuest.tsxMessages, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        filename='Panel'
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

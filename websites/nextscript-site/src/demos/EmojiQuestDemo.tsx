import { Code, DemoContainer } from '@rue/websites-shared'
import { highlightCode } from "../highlighter"
import { ion } from '@rue/quarky'
import { EmojiQuest } from './EmojiQuest'

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
        <EmojiQuest />
      </DemoContainer>
      <Code
        trusted
        main={{ name: 'nsx', code: nsxRoot }}
        alt={{ name: 'tsx', code: tsxRoot, lang: 'tsx' }}
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

const nsxRoot =
`import { ionic, component } from "@rue/luent";
import { Panel } from "../components/Panel"

function EmojiQuest() {
  const powers = ['🍀', '🍄', '✨', '🔥', '🔮', '🪵'] as const
  const powerset = ionic([] as typeof powers[number][], {
    addRandomPower() {
      this.push(powers[Math.floor(Math.random() * powers.length)])
    }
  })

  return component(
    <>
      <main>
        <EmojiGame></EmojiGame>
      </main>
      <aside>
        <Panel title="Powerset">
          <Powerset mu:powerset={powerset} limit={10}></Powerset>
        </Panel>
      </aside>
    </>
  )
}
`

const tsxRoot =
`import { ionic, component } from "@rue/luent";
import { Panel } from "../components/Panel"

function EmojiQuest() {
  const powers = ['🍀', '🍄', '✨', '🔥', '🔮', '🪵'] as const
  const powerset = ionic([] as typeof powers[number][], {
    addRandomPower() {
      this.push(powers[Math.floor(Math.random() * powers.length)])
    }
  })

  return component(
    <>
      <main>
        <EmojiGame></EmojiGame>
      </main>
      <aside>
        <Panel title="Powerset">
          <Powerset mu:powerset={powerset} limit={10}></Powerset>
        </Panel>
      </aside>
    </>
  )
}
`
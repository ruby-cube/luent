import { Code, DemoContainer, Palettable } from '@luent/websites-shared'
import { highlightCode } from "../highlighter"
import { css, Else, ElseIf, FromTag, If, RenderSlot, Style, ion, MutableIon} from 'luent'

export function PalettableDemo() {
  const $tab = ion('main' as 'main' | 'alt', {
    toggle() {
      this.value === 'main'
        ? this.value = 'alt'
        : this.value = 'main'
    }
  })
  const $sectionTab = ion('components' as 'components' | 'draggable' | 'colors' | 'celebration')
  return (
    <>
      <DemoContainer style='padding: 0; height: 460px'>
        <div is-host style="height: 100%; width: 100%;">
          {Palettable()}
        </div>
      </DemoContainer>
      <nav style='margin-top: 3rem'>
        <CodeSectionTab name='components' mu:sectionTab={$sectionTab}>
          Components
        </CodeSectionTab>
        {VerticalSpacer()}
        <CodeSectionTab name='colors' mu:sectionTab={$sectionTab}>
          Colors Kit
        </CodeSectionTab>
        {VerticalSpacer()}
        <CodeSectionTab name='draggable' mu:sectionTab={$sectionTab}>
          Draggable Kit
        </CodeSectionTab>
        {VerticalSpacer()}
        <CodeSectionTab name='celebration' mu:sectionTab={$sectionTab}>
          Celebration Kit
        </CodeSectionTab>
      </nav>
      {If(() => $sectionTab() === 'components',
        <>
          <Code
            trusted
            main={{ name: 'nsx', code: Palettable.nsx }}
            alt={{ name: 'tsx', code: Palettable.tsx, lang: 'tsx' }}
            highlight={highlightCode}
            showSticky
            tab={$tab}
          />
          <Code
            trusted
            main={{ name: 'nsx', code: Palettable.nsxColorPalette }}
            alt={{ name: 'tsx', code: Palettable.tsxColorPalette, lang: 'tsx' }}
            highlight={highlightCode}
            showSticky
            tab={$tab}
          />
          <Code
            trusted
            main={{ name: 'nsx', code: Palettable.nsxGap }}
            alt={{ name: 'tsx', code: Palettable.tsxGap, lang: 'tsx' }}
            highlight={highlightCode}
            showSticky
            tab={$tab}
          />
        </>
      )}
      {ElseIf(() => $sectionTab() === 'colors',
        <Code
          trusted
          main={{ name: 'nsx', code: Palettable.nsxColorsKit }}
          alt={{ name: 'tsx', code: Palettable.tsxColorsKit, lang: 'tsx' }}
          highlight={highlightCode}
          showSticky
          tab={$tab}
        />
      )}
      {ElseIf(() => $sectionTab() === 'draggable',
        <Code
          trusted
          main={{ name: 'nsx', code: Palettable.nsxDraggableKit }}
          alt={{ name: 'tsx', code: Palettable.tsxDraggableKit, lang: 'tsx' }}
          highlight={highlightCode}
          showSticky
          tab={$tab}
        />
      )}
      {Else(
        <Code
          trusted
          main={{ name: 'nsx', code: Palettable.nsxCelebrationKit }}
          alt={{ name: 'tsx', code: Palettable.tsxCelebrationKit, lang: 'tsx' }}
          highlight={highlightCode}
          showSticky
          tab={$tab}
        />
      )}
    </>
  )
}


function VerticalSpacer() {
  return <span style='padding-inline: 1.5rem; color: var(--vp-c-text-3)'>|</span>
}

function CodeSectionTab(setup: FromTag<{
  Slot: RenderSlot,
  name: string,
  'mu:sectionTab': MutableIon<string>
}>) {
  const { Slot, name, mu: { $sectionTab } } = setup;
  return <>
    <button
      class={['code-section-tab', { 'active-code-section-tab': () => $sectionTab() === name }]}
      on:click={() => $sectionTab.value = name}
    ><h5>{Slot()}</h5></button>
    {Style(css`
      .code-section-tab {
        color: var(--vp-c-text-1);
      }
      
      .code-section-tab:hover {
        color: var(--vp-c-brand-2);
      }
      
      .active-code-section-tab {
        color: var(--vp-c-brand-1);
      }
    `)}
  </>
}
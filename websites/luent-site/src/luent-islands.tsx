import { CodeGlimpses } from "./CodeGlimpses";
export { getPortals, runWithPortals, RenderPageWithStyles, transformPortals } from 'luent'
import { mountIsland, MICROCLASS_MERGE, writeIsland, provideRoot, atTick } from 'luent'
export * from "@luent/websites-shared";
import { twMerge } from 'tailwind-merge';
import { highlightCode } from "./highlighter";
import { Code, extractParams, isMounted, MountIslands, parseNSXBlock, WriteIslands } from "@luent/websites-shared";
import { LanguageToggle } from "./LanguageToggle";
import { HabitTrackerDemo } from "./demos/HabitTrackerDemo";
import { EmojiQuestDemo } from "./demos/EmojiQuestDemo";
import { PalettableDemo } from "./demos/PalettableDemo";

function renderCodeGlimpses() {
  provideRoot(MICROCLASS_MERGE, twMerge)
  return CodeGlimpses()
}

function renderNSXCode(setup: { nsName: string, tsName: string, nsCode: string, tsCode: string }) {
  const { nsName, tsName, nsCode, tsCode } = setup;
  provideRoot(MICROCLASS_MERGE, twMerge)
  return <Code
    trusted
    main={{ name: nsName, code: nsCode }}
    alt={{ name: tsName, code: tsCode, lang: tsName }}
    highlight={highlightCode}
  />
}

const LANGUAGE_TOGGLE = 'section.VPSidebarItem p.text'





export const Islands: WriteIslands = {
  'code-glimpses': () => writeIsland(renderCodeGlimpses),
  'ns-code': (inner) => writeIsland(() => {
    console.log('inner nsx code string', inner)
    return renderNSXCode(parseNSXBlock(inner))
  }),
  'language-toggle': () => writeIsland(LanguageToggle),
  'habit-tracker-demo': () => writeIsland(HabitTrackerDemo),
  'emoji-quest-demo': () => writeIsland(EmojiQuestDemo),
  'palettable-demo': () => writeIsland(PalettableDemo),
  // 'doodle-canvas-demo': () => writeIsland(DoodleCanvasDemo)
}

export const islands: MountIslands = {
  // 'code-glimpses': () => class extends HTMLElement {
  //   connectedCallback() {
  //     mountIsland(() => {
  //       provideRoot(MICROCLASS_MERGE, twMerge)
  //       return CodeGlimpses()
  //     }, this)
  //   }
  // },
  'language-toggle': () => {
    atTick(() => {
      const node = document.querySelector(LANGUAGE_TOGGLE)
      console.log('hydrating language-toggle', node)
      if (!node || isMounted(node)) return;
      node.innerHTML = ''
      mountIsland(LanguageToggle, node)
    })
  },
  'code-glimpses': ({ node }) => {
    console.log('#### mounting node', node)
    mountIsland(renderCodeGlimpses, node)
  },

  'ns-code': ({ inner, node }: { inner: string, node: HTMLElement }) => {
    mountIsland(() => renderNSXCode(parseNSXBlock(extractParams(inner))), node)
  },

  'habit-tracker-demo': ({ node }) => {
    mountIsland(HabitTrackerDemo, node)
  },
  'emoji-quest-demo': ({ node }) => {
    mountIsland(EmojiQuestDemo, node)
  },
  'palettable-demo': ({ node }) => {
    console.log('mounting palettable-demo')
    mountIsland(PalettableDemo, node)
  },
  // 'doodle-canvas-demo': ({ node }) => {
  //   mountIsland(DoodleCanvasDemo, node)
  // },

}


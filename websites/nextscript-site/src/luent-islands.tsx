import { CodeGlimpses } from "./CodeGlimpses";
import { HabitTrackerDemo } from "./demos/HabitTrackerDemo"
export { getPortals, runWithPortals, RenderPageWithStyles, transformPortals } from 'luent'
import { mountIsland, MICROCLASS_MERGE, writeIsland, provideRoot } from 'luent'
import { EmojiQuestDemo } from "./demos/EmojiQuestDemo";
import { DoodleCanvasDemo } from "./demos/DoodleCanvasDemo";
export * from "@luent/websites-shared";
import { Code, extractParams, MountIslands, parseNSXBlock, WriteIslands } from "@luent/websites-shared";
import { twMerge } from "tailwind-merge";
import { highlightCode } from "./highlighter";



export const Islands: WriteIslands = {
  'code-glimpses': () => writeIsland(CodeGlimpses),
  'habit-tracker-demo': () => writeIsland(HabitTrackerDemo),
  'emoji-quest-demo': () => writeIsland(EmojiQuestDemo),
  'doodle-canvas-demo': () => writeIsland(DoodleCanvasDemo)
}


export const islands: MountIslands = {
  'code-glimpses': ({ node }) => {
    console.log('#### mounting node', node)
    mountIsland(CodeGlimpses, node)
  },
  'habit-tracker-demo': ({ node }) => {
    console.log('mounting habit-tracker-demo')
    mountIsland(HabitTrackerDemo, node)
  },
  'emoji-quest-demo': ({ node }) => {
    mountIsland(EmojiQuestDemo, node)
  },
  'doodle-canvas-demo': ({ node }) => {
    mountIsland(DoodleCanvasDemo, node)
  },

  'ns-code': ({ inner, node }: { inner: string, node: HTMLElement }) => {
    mountIsland(() => renderNSXCode(parseNSXBlock(extractParams(inner))), node)
  },

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

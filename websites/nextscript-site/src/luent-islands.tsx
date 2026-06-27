import { CodeGlimpses } from "./CodeGlimpses";
import { HabitTrackerDemo } from "./demos/HabitTrackerDemo"
export { getPortals, runWithPortals, RenderPage } from '@rue/luent'
import { mount, MICROCLASS_MERGE, writeRoot, provideRoot } from '@rue/luent'
import { EmojiQuestDemo } from "./demos/EmojiQuestDemo";
import { DoodleCanvasDemo } from "./demos/DoodleCanvasDemo";
export * from "@rue/websites-shared";
import { twMerge } from "tailwind-merge"
import { Code } from "@rue/websites-shared";

export const writeIsland = {
  'code-glimpses': () => writeRoot(() => {
    provideRoot(MICROCLASS_MERGE, twMerge)
    return CodeGlimpses()
  }),
  'habit-tracker-demo': () => writeRoot(HabitTrackerDemo),
  'emoji-quest-demo': () => writeRoot(EmojiQuestDemo),
  'doodle-canvas-demo': () => writeRoot(DoodleCanvasDemo)
}

export const islands = {
  'code-glimpses': () => class extends HTMLElement {
    constructor() {
      super()
      mount(() => {
        provideRoot(MICROCLASS_MERGE, twMerge)
        return CodeGlimpses()
      }, this)
    }
  },
  'habit-tracker-demo': () => class extends HTMLElement {
    constructor() {
      super()
      mount(HabitTrackerDemo, this)
    }
  },
  'emoji-quest-demo': () => class extends HTMLElement {
    constructor() {
      super()
      mount(EmojiQuestDemo, this)
    }
  },
  'doodle-canvas-demo': () => class extends HTMLElement {
    constructor() {
      super()
      mount(DoodleCanvasDemo, this)
    }
  },

  'nsx-code': () => class extends HTMLElement {
    constructor() {
      super()
      mount(() => <Code></Code>, this)
    }
  },

}


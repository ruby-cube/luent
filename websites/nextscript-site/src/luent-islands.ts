import { CodeGlimpses } from "./CodeGlimpses";
import { HabitTrackerDemo } from "./demos/HabitTrackerDemo"
export { getPortals, runWithPortals, RenderPage } from '@rue/luent'
import { createRoot, writeRoot } from '@rue/luent'
import { EmojiQuestDemo } from "./demos/EmojiQuestDemo";
import { DoodleCanvasDemo } from "./demos/DoodleCanvasDemo";

export const writeIsland = {
  'code-glimpses': () => writeRoot(CodeGlimpses),
  'habit-tracker-demo': () => writeRoot(HabitTrackerDemo),
  'emoji-quest-demo': () => writeRoot(EmojiQuestDemo),
  'doodle-canvas-demo': () => writeRoot(DoodleCanvasDemo)
}

export const islands = {
  'code-glimpses': () => class extends HTMLElement {
    constructor() {
      super()
      createRoot(CodeGlimpses).mount(this)
    }
  },
  'habit-tracker-demo': () => class extends HTMLElement {
    constructor() {
      super()
      createRoot(HabitTrackerDemo).mount(this)
    }
  },
  'emoji-quest-demo': () => class extends HTMLElement {
    constructor() {
      super()
      createRoot(EmojiQuestDemo).mount(this)
    }
  },
  'doodle-canvas-demo': () => class extends HTMLElement {
    constructor() {
      super()
      createRoot(DoodleCanvasDemo).mount(this)
    }
  }
}


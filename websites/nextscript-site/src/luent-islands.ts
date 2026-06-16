import { CodeGlimpses } from "./CodeGlimpses";
import { HabitTrackerDemo } from "./demos/HabitTrackerDemo";
export { getPortals, runWithPortals } from '@rue/luent'
import { writeRoot } from '@rue/luent'
import { TranspilationNote } from "./TranspilationNote";


export const islands = {
  CodeGlimpses: () => writeRoot(CodeGlimpses),
  HabitTrackerDemo: () => writeRoot(HabitTrackerDemo),
  TranspilationNote: () => writeRoot(TranspilationNote)
}
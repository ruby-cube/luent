import { renderToString } from "packages/luent/src/server/writeHTML";
import { HelloWorld } from "./HelloWorld";
import { writeHomeTour } from "./load-home-tour";
import { writeHabitTrackerDemo } from "./load-habit-tracker";
export { getPortals, runWithPortals } from '@rue/luent'

export const islands = {
  HelloWorld,
  HomeTour: writeHomeTour,
  HabitTrackerDemo: writeHabitTrackerDemo
}
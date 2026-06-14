import { renderToString } from "packages/luent/src/server/renderer";
import { HelloWorld } from "./HelloWorld";
import { writeHomeTour } from "./load-home-tour";

export const islands = {
  HelloWorld,
  HomeTour: writeHomeTour
}
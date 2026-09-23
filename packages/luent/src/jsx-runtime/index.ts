import { AnyObject } from "@luent/types";
import { isPlainObject, normalizeToArray } from "@luent/utils";
import { writeJSXNode } from "../server/writeJSXNode";
import { makeJSXNode, RawJSXNode } from "../node/makeJSXNode";
import { TagName } from "../element/setUpElement";
import { RenderTag } from "../component/bindings-types";
export type { JSX } from "./types/index";

// without custom jsx compiler
// - nodeEntity | nodeEntity[]
// - () => nodeEntity | nodeEntity[]
// with custom jsx compiler





export const jsxDEV = jsx;

export const jsxs = jsx;

export function jsx(nodeType: TagName | RenderTag, config: { children: RenderTag | RawJSXNode | AnyObject } & AnyObject) {
  let Slot = config.children;
  delete config.children
  config.Slot = Slot ?? (Slot = config.Slot);
  if (typeof Slot !== 'function' && Slot !== undefined) {
    if (__INTERNAL__) console.warn('Slot is not a function', Slot)
    return;
  }
  if (nodeType === Fragment) {
    return normalizeToArray(Slot?.())
  }
  if (import.meta.env.SSR) {
    return writeJSXNode(
      nodeType,
      Slot as (() => RawJSXNode[]) | undefined,
      config
    )
  }
  return makeJSXNode(
    nodeType,
    Slot as (() => RawJSXNode[]) | undefined,
    config
  );
}

// function processSlot(Slot: Slot | { mu: AnyObject } | { [key: string]: Slot } | undefined) {
//    if (Slot === undefined) return undefined;
//    if (isPlainObject(Slot)) {
//       console.log('plain obj slot', Slot)
//       // named slots, innerHTML kit, or two-way binding
//       return Slot;
//    }
//    return normalizeToRenderFunction(Slot)
// }


export function Fragment() { }
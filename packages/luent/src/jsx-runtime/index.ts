import { TagName, makeJSXNode, RenderSlot, Context, RawJSXNode, ComponentTag } from "../index";
import { AnyObject } from "@rue/types";
import { isPlainObject, normalizeToArray } from "@rue/utils";

// without custom jsx compiler
// - nodeEntity | nodeEntity[]
// - () => nodeEntity | nodeEntity[]
// with custom jsx compiler





export const jsxDEV = jsx;

export const jsxs = jsx;

export function jsx(nodeType: TagName | ComponentTag, config: { children: RenderSlot | RawJSXNode | AnyObject } & AnyObject) {
   const Slot = config.children;
   delete config.children
   config.Slot = Slot ?? config.Slot;
   if (nodeType === Context) {
      return Context({ Slot, provide: config.provide } as any)
   }
   if (nodeType === Fragment) {
      return normalizeToArray(Slot())
   }
   return makeJSXNode(
      nodeType,
      Slot,
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
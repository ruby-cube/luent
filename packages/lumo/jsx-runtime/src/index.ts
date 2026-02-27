import { ComponentForge, TagName, makeJSXNode, normalizeToRenderFunction, RenderSlot, Commons, RawJSXNode } from "@rue/lumo";
import { AnyObject } from "@rue/types";
import { isPlainObject, normalizeToArray } from "@rue/utils";

// without custom jsx compiler
// - nodeEntity | nodeEntity[]
// - () => nodeEntity | nodeEntity[]
// with custom jsx compiler


export const jsxDEV = jsx;

export const jsxs = jsx;

export function jsx(nodeType: TagName | ComponentForge, config: { children: RenderSlot | RawJSXNode | AnyObject } & AnyObject) {
   const Slot = processSlot(config.children);
   if (nodeType === Commons) {
      return Commons({Slot: config.children, provide: config.provide} as any)
   }
   if (nodeType === Fragment) {
      return normalizeToArray(config.children)
   }
   return makeJSXNode(
      nodeType,
      Slot,
      config
   );
}

function processSlot(Slot: Slot | { mu: AnyObject } | { [key: string]: Slot } | undefined) {
   if (Slot === undefined) return undefined;
   if (isPlainObject(Slot)) {
      // named slots, innerHTML kit, or two-way binding
      return Slot;
   }
   return normalizeToRenderFunction(<Slot>Slot)
}


export function Fragment() { }
import { ComponentSetup, HTMLTag, makeNode, normalizeToRenderFunction, Slot, Commons } from "@rue/lumo";
import { AnyObject } from "@rue/types";
import { isFunction, isObjectLiteral, normalizeToArray } from "@rue/utils";

// without custom jsx compiler
// - nodeEntity | nodeEntity[]
// - () => nodeEntity | nodeEntity[]
// with custom jsx compiler

export const jsxDEV = jsx;

export const jsxs = jsx;

export function jsx(nodeType: HTMLTag | ComponentSetup, config: { children: Slot } & AnyObject) {
   const Slot = processSlot(config.children);
   if (nodeType === Commons) {
      return Commons({Slot: config.children, provide: config.provide} as any)
   }
   if (isFunction(nodeType) && nodeType !== Fragment) {
      return makeNode(
         nodeType,
         Slot,
         config
      );
   }
   if (nodeType === Fragment) {
      return normalizeToArray(config.children)
   }
   return makeNode(
      nodeType,
      Slot,
      config
   );
}

function processSlot(Slot: Slot | { mu: AnyObject } | { [key: string]: Slot } | undefined) {
   if (Slot === undefined) return undefined;
   if (isObjectLiteral(Slot)) {
      // named slots, innerHTML kit, or two-way binding
      return Slot;
   }
   return normalizeToRenderFunction(<Slot>Slot)
}


export function Fragment() { }
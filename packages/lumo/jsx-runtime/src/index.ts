import { ComponentSetup, HTMLTag, makeNode, normalizeToRenderFunction, Slot } from "@rue/lumo";
import { AnyObject } from "@rue/types";
import { isFunction, isObjectLiteral, normalizeToArray } from "@rue/utils";

// without custom jsx compiler
// - nodeEntity | nodeEntity[]
// - () => nodeEntity | nodeEntity[]
// with custom jsx compiler

export const jsxDEV = jsx;

export const jsxs = jsx;

export function jsx(nodeType: HTMLTag | ComponentSetup, config: { children: Slot }) {
   const Slot = processSlot(config.children);
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


// export function jsxs(nodeType: HTMLTag | ComponentSetup, config: { children: NodeEntity[] }) {
//     console.log("JSXS")
//     console.trace()
//     if (nodeType === Fragment) return config.children;
//     //@ts-ignore
//     return makeNode(nodeType, config.children, config)
// }

export function Fragment() { }
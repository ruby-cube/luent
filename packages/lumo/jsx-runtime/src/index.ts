import { ComponentForge, TagName, makeJSXNode, normalizeToRenderFunction, RenderSlot, Context, RawJSXNode } from "@rue/lumo";
import { AnyObject } from "@rue/types";
import { isPlainObject, normalizeToArray } from "@rue/utils";

// without custom jsx compiler
// - nodeEntity | nodeEntity[]
// - () => nodeEntity | nodeEntity[]
// with custom jsx compiler


isEqual({} as any as Luent._TransitionEvent, {} as any as Luent.TransitionEvent)

function isEqual(x: Luent.TransitionEvent, y: Luent._TransitionEvent) {

}


export const jsxDEV = jsx;

export const jsxs = jsx;

export function jsx(nodeType: TagName | ComponentForge, config: { children: RenderSlot | RawJSXNode | AnyObject } & AnyObject) {
   const Slot = config.children;
   delete config.children
   config.Slot = Slot ?? config.Slot;
   console.log('Slot name, jsx', Slot, config.children)
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
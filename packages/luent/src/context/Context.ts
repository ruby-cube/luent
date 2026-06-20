import { ContextNode, getClosestContext, popContext, pushContext } from "./context-stack";
import { markIfMuIon } from "./provide";
import { Ion } from "@rue/quarky";
import { ContextEntryKey, toContextKey } from "./ContextKey";
import { FromTag, RenderSlot } from "../component/x-Input";
import { debug, normalizeToArray } from "@rue/utils";
import {  unnestComponent } from "@rue/nextscript";
import { component } from "..";

export interface NodeContext {
   entries: Map<string, unknown>;
   parent: NodeContext | RootContext,
   root: RootContext,
   ground?: RootContext,
   muIons: Set<Ion> | undefined
}

export interface RootContext {
   entries?: Map<string, any>;
   parent?: RootContext,
   root: RootContext,
   ground?: RootContext,
   muIons: Set<Ion> | undefined
}


export type Provided = { 0: ContextEntryKey | string, 1: any }[] | { 0: ContextEntryKey | string, 1: any }

//API

export function Context(
   { Slot, provide }: {
      provide: Provided,
      Slot: RenderSlot
   }
) {
   if (!Slot) debug.warn(`Extraneous <o:context>`)
   return component(callWithContext(Slot, createContextNode(provide)))
}

export function createContextNode(
   provide: Provided,
   parentContext: ContextNode | undefined = getClosestContext(),
) {
   if (!parentContext) {
      throw new Error(`no context found :( This should never happen`)
   }
   const [entries, muIons] = toContextEntries(normalizeToArray(provide))
   const context: NodeContext = {
      entries,
      parent: parentContext,
      root: parentContext?.root,
      ground: parentContext?.ground,
      muIons
   }
   return context;
}


export function callWithContext(
   Slot: RenderSlot,
   context: ContextNode
) {

   pushContext(context)
   const nodeEntities = Slot()
   popContext()
   return unnestComponent(nodeEntities)
}

export function wrapWithContext(
   Slot: RenderSlot,
   provide: Provided) {
   const context = createContextNode(provide)
   return (arg: any) => {
      return callWithContext(() => Slot(arg), context)
   }
}

export function toContextEntries(provided: [ContextEntryKey, unknown][]): [Map<string, unknown>, undefined | Set<Ion>] {
   const context = { muIons: undefined }
   const entries: Map<string, unknown> = new Map()
   for (const { 0: key, 1: value } of provided) {
      markIfMuIon(key, value, context)
      entries.set(toContextKey(key), value)
   }
   return [entries, context.muIons]
}

// export function createContext(
//     Slot: () => JSXNode,
//     config: ComponentConfig,
// ) {
//    return Context({ Slot, provide: config.provide })
// }




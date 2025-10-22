import { component, unnestComponent } from "../component/Component";
import { CommonsNode, getClosestCommons, popCommons, pushCommons } from "./commons-stack";
import { AppCommons, markIfMuIon } from "./provide";
import { debug, Ion } from "@rue/quarky";
import { CommonsEntryKey, toCommonsKey } from "./NubKey";
import { FromTag, RenderSlot } from "../component/Input";

export interface NodeCommons {
   entries: Map<string, unknown>;
   parent: NodeCommons | AppCommons,
   app: AppCommons,
   global?: AppCommons,
   muIons: Set<Ion> | undefined
}

export type Provided = [CommonsEntryKey | string, any][]

//API

export function Commons(
   { Slot, provide }: FromTag<{
      provide: Provided,
      Slot: RenderSlot
   }>
) {
   if (!Slot) debug.warn(`Extraneous <Commons>`)
   return component(callWithCommons(Slot, createCommonsNode(provide)))
}

export function createCommonsNode(
   provide: Provided,
   parentCommons: CommonsNode | undefined = getClosestCommons(),
) {
   if (!parentCommons) {
      debug.traceAsyncPath()
      throw new Error(`no commons found :( This should never happen`)
   }
   const [entries, muIons] = toCommonsEntries(provide)
   const commons: NodeCommons = {
      entries,
      parent: parentCommons,
      app: parentCommons?.app,
      global: parentCommons?.global,
      muIons
   }
   return commons;
}


export function callWithCommons(
   Slot: RenderSlot,
   commons: CommonsNode
) {

   pushCommons(commons)
   const nodeEntities = Slot()
   popCommons()
   return unnestComponent(nodeEntities)
}

export function wrapWithCommons(
   Slot: RenderSlot,
   provide: Provided) {
   const commons = createCommonsNode(provide)
   return (arg: any) => {
      return callWithCommons(() => Slot(arg), commons)
   }
}

export function toCommonsEntries(provided: [CommonsEntryKey | string, unknown][]): [Map<string, unknown>, undefined | Set<Ion>] {
   const commons = { muIons: undefined }
   const entries: Map<string, unknown> = new Map()
   for (const [key, value] of provided) {
      markIfMuIon(key, value, commons)
      entries.set(toCommonsKey(key), value)
   }
   return [entries, commons.muIons]
}

// export function createCommons(
//     Slot: () => JSXNode,
//     config: ComponentConfig,
// ) {
//    return Commons({ Slot, provide: config.provide })
// }




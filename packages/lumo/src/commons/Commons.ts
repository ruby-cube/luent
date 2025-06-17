import { unnestComponent } from "../component/InternalComponent";
import { Commons as CommonsType, getClosestCommons, popCommons, pushCommons } from "./commons-stack";
import { AppCommons, markIfMuIon } from "./provide";
import { debug, Ion } from "@rue/quarky";
import { CommonsEntryKey, toCommonsKey } from "./CommonsKey";
import { fromTag, RenderSlot } from "../component/fromTag";

export interface NodeCommons {
   entries: Map<string, unknown>;
   parent: NodeCommons | AppCommons,
   app: AppCommons,
   global?: AppCommons,
   muIons: Set<Ion> | undefined
}

export type Provided = [CommonsEntryKey | string, any][]

//API

export function Commons(input = fromTag<{
   provide: Provided,
   Slot: RenderSlot
}>()) {
   const { Slot, provide } = input
   if (!Slot) debug.warn(`Extraneous <Commons>`)
   const parentCommons = getClosestCommons()
   if (!parentCommons) {
      debug.traceAsyncPath()
      throw new Error(`no commons found :( This should never happen`)
   }
   return wrapWithCommons(provide, Slot, parentCommons)
}

export function wrapWithCommons(
   provide: Provided,
   Slot: RenderSlot,
   parentCommons: CommonsType,
) {

   const [entries, muIons] = toCommonsEntries(provide)
   const commons: NodeCommons = {
      entries,
      parent: parentCommons,
      app: parentCommons?.app,
      global: parentCommons?.global,
      muIons
   }
   pushCommons(commons)
   const nodeEntities = Slot()
   popCommons()
   return unnestComponent(nodeEntities)
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
//     Slot: () => NodeEntity,
//     config: ComponentConfig,
// ) {
//    return Commons({ Slot, provide: config.provide })
// }




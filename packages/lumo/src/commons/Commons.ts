import { unnestComponent } from "../component/InternalComponent";
import { getClosestCommons, popCommons, pushCommons } from "./commons-stack";
import { AppCommons } from "./provide";
import { debug, Ion } from "@rue/quarky";
import { CommonsEntryKey, getCommonsKey } from "./CommonsKey";
import { fromTag, RenderSlot } from "../component/fromTag";
import { assertMutableIon } from "../component/Input";

export interface NodeCommons {
   entries: Map<string, unknown>;
   parent: NodeCommons | AppCommons,
   app: AppCommons,
   global?: AppCommons,
   muIons: Set<Ion> | undefined
}


//API

export function Commons(input = fromTag<{
   provide: [CommonsEntryKey | string, unknown][],
   Slot: RenderSlot
}>()) {
   const { Slot } = input
   console.log('### Slot', Slot)

   if (!Slot) debug.warn(`Extraneous <Commons>`)

   const parentCommons = getClosestCommons()
   if (!parentCommons) {
      debug.traceAsyncPath()
      throw new Error(`no commons found :( This should never happen`)
   }

   const [entries, muIons] = toCommonsEntries(input.provide)
   const commons: NodeCommons = {
      entries,
      parent: parentCommons,
      app: parentCommons?.app,
      global: parentCommons?.global,
      muIons
   }
   pushCommons(commons)
   const nodeEntities = Slot()
   console.log('### Slot entities', nodeEntities)
   popCommons()
   return unnestComponent(nodeEntities)
}

function toCommonsEntries(provided: [CommonsEntryKey | string, unknown][]): [Map<string, unknown>, undefined | Set<Ion>] {
   let muIons: Set<Ion> | undefined
   const entries: Map<string, unknown> = new Map()
   for (const [key, value] of provided) {
      const label = typeof key === 'string' ? key : key.name;
      if (label.startsWith('MU_')) {
         assertMutableIon(value)
         muIons ? muIons.add(value) : muIons = new Set([value])
      }
      entries.set(getCommonsKey(key), value)
   }
   return [entries, muIons]
}

// export function createCommons(
//     Slot: () => NodeEntity,
//     config: ComponentConfig,
// ) {
//    return Commons({ Slot, provide: config.provide })
// }




import {  unnestComponent } from "../component/InternalComponent";
import { getClosestCommons, popCommons, pushCommons } from "./commons-stack";
import { AppCommons } from "./provide";
import { ComponentConfig, NodeEntity } from "../node/makeNode";
import { debug } from "@rue/quarky";
import { CommonsEntryKey } from "./CommonsKey";
import { fromTag } from "../component/fromTag";
import { Slot, v } from "../component/InputTypes";

export interface NodeCommons {
   entries: Map<CommonsEntryKey, unknown>;
   parent: NodeCommons | AppCommons,
   app: AppCommons,
   global?: AppCommons,
}


//API

export function Commons(input = fromTag({
   provide: v<[CommonsEntryKey, unknown][]>,
   Slot: Slot
})) {
   const { Slot } = input
   console.log('### Slot', Slot)

   if (!Slot) debug.warn(`Extraneous <Commons>`)

   const parentCommons = getClosestCommons()
   if (!parentCommons) {
      debug.traceAsyncPath()
      throw new Error(`no commons found :( This should never happen`)
   }

   const commons: NodeCommons = {
      entries: new Map(input.provide),
      parent: parentCommons,
      app: parentCommons?.app,
      global: parentCommons?.global
   }
   pushCommons(commons)
   const nodeEntities = Slot()
   console.log('### Slot entities', nodeEntities)
   popCommons()
   return unnestComponent(nodeEntities)
}

// export function createCommons(
//     Slot: () => NodeEntity,
//     config: ComponentConfig,
// ) {
//    return Commons({ Slot, provide: config.provide })
// }




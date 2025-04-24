import { component, InternalComponent, Slot, unnestComponent } from "../component/InternalComponent";
import { getClosestCommons, popCommons, pushCommons } from "./commons-stack";
import { AppCommons } from "./provide";
import { ComponentConfig, NodeEntity } from "../node/makeNode";
import { CommonsKeyMap, CommonsEntryKey } from "@rue/lumo";
import { debug } from "@rue/quarky";

export interface NodeCommons {
    entries: Map<CommonsEntryKey, unknown>;
    parent: NodeCommons | AppCommons,
    app: AppCommons,
    global?: AppCommons,
}


//API

export function Commons(input: {
    provide: [CommonsEntryKey, unknown][],
    Slot: ()=>NodeEntity
}) {
    const { Slot } = input

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
    popCommons()
    return unnestComponent(nodeEntities)
}

// export function createCommons(
//     Slot: () => NodeEntity,
//     config: ComponentConfig,
// ) {
//    return Commons({ Slot, provide: config.provide })
// }




import { AnyObject } from "@rue/types";
import { component, InternalComponent, Slot } from "../component/InternalComponent";
import { getClosestCommons, popCommons, pushCommons } from "./commons-stack";
import { AppCommons, _ContextInputType } from "./provide";
import { ComponentConfig, NodeEntity } from "../node/makeNode";
import { CommonsKeyMap } from "@rue/lumo";
import { __DEV__asyncTrace } from "../../../flask/debug";

export interface NodeCommons {
    entries: AnyObject;
    parent: NodeCommons | AppCommons,
    app: AppCommons,
    global?: AppCommons,
}

export type CommonsEntries<T> = {
    [K in keyof T]: K extends keyof CommonsKeyMap ? _ContextInputType<CommonsKeyMap[K]> : any;
}

//API

export function Commons<T extends CommonsEntries<T>>(input: {
    provide: T,
    Slot: ()=>NodeEntity
}) {
    const { Slot } = input

    const parentCommons = getClosestCommons()
    if (!parentCommons) {
       __DEV__asyncTrace()
      throw new Error(`no commons found :( This should never happen`)
    }

    const commons: NodeCommons = {
        entries: input.provide,
        parent: parentCommons,
        app: parentCommons?.app,
        global: parentCommons?.global
    }
    pushCommons(commons)
    const nodeEntities = Slot()
    popCommons()
    return component(nodeEntities)
}

export function createCommons(
    Slot: () => NodeEntity,
    config: ComponentConfig,
): InternalComponent {
   const output = Commons({ Slot, provide: config.provide })
   return new InternalComponent(output, undefined, undefined);
}




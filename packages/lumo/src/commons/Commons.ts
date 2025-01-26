import { AnyObject } from "@rue/types";
import { component, InternalComponent, Slot } from "../component/InternalComponent";
import { getClosestCommons, popCommons, pushCommons } from "./commons-stack";
import { AppCommons, _ContextInputType } from "./provide";
import { ComponentConfig, NodeEntity } from "../node/makeNode";
import { ContextKeyMap } from "@rue/lumo";
import { asyncTrace_DEV } from "../../../flask/debug";

export interface NodeCommons {
    entries: AnyObject;
    parent: NodeCommons | AppCommons,
    app: AppCommons,
    global?: AppCommons,
}

export type ContextEntries<T> = {
    [K in keyof T]: K extends keyof ContextKeyMap ? _ContextInputType<ContextKeyMap[K]> : any;
}

//API
export const context = {
    node: Context
}


export function Context<T extends ContextEntries<T>>(input: {
    provide: T,
    Slot: ()=>NodeEntity
}) {
    const { Slot } = input

    const parentContext = getClosestCommons()
    if (!parentContext) {
       asyncTrace_DEV()
      throw new Error(`no context found :( This should never happen`)
    }

    const context: NodeCommons = {
        entries: input.provide,
        parent: parentContext,
        app: parentContext?.app,
        global: parentContext?.global
    }
    pushCommons(context)
    const nodeEntities = Slot()
    popCommons()
    return component(nodeEntities)
}

export function createCommons(
    Slot: () => NodeEntity,
    config: ComponentConfig,
): InternalComponent {
   const output = Context({ Slot, provide: config.provide })
   return new InternalComponent(output, undefined, undefined);
}




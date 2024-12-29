import { AnyObject } from "@rue/types";
import { component, InternalComponent, Slot } from "../component/InternalComponent";
import { getCurrentContext, popContext, pushContext } from "./context-stack";
import { AppContext, _ContextInputType } from "./provide";
import { ComponentConfig, NodeEntity } from "../node/makeNode";
import { ContextKeyMap } from "@rue/lumo";

export interface NodeContext {
    entries: AnyObject;
    parent: NodeContext | AppContext,
    app: AppContext,
    transapp?: AppContext,
}

export type ContextEntries<T> = {
    [K in keyof T]: K extends keyof ContextKeyMap ? _ContextInputType<ContextKeyMap[K]> : any;
}

//API
export const context = {
    node: Context
}


export function Context<T extends ContextEntries<T>>(input: {
    with: T,
    Slot: ()=>NodeEntity
}) {
    const { Slot } = input

    const parentContext = getCurrentContext()
    if (!parentContext) throw new Error(`no context found :( This should never happen`)

    const context: NodeContext = {
        entries: input.with,
        parent: parentContext,
        app: parentContext?.app,
        transapp: parentContext?.transapp
    }
    pushContext(context)
    const nodeEntities = Slot()
    popContext()
    return component(nodeEntities)
}

export function createNodeContext(
    Slot: () => NodeEntity,
    config: ComponentConfig,
): InternalComponent {
   const output = Context({ Slot, with: config.with })
   return new InternalComponent(output, undefined, undefined);
}




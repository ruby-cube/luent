import { AnyObject } from "@rue/types";
import { Component, InternalComponent } from "../component/InternalComponent";
import { initializeComponent } from "../component/makeComponent";
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
    renderSlot: (() => NodeEntity | NodeEntity[]) | NodeEntity | NodeEntity[]
}) {
    const { renderSlot } = input

    const parentContext = getCurrentContext()
    if (!parentContext) throw new Error(`no context found :( This should never happen`)

    const context: NodeContext = {
        entries: input.with,
        parent: parentContext,
        app: parentContext?.app,
        transapp: parentContext?.transapp
    }

    pushContext(context)
    const nodeEntities = renderSlot()
    popContext()
    return Component(nodeEntities)
}

export function createNodeContext(
    renderSlot: () => NodeEntity | NodeEntity[],
    config: ComponentConfig,
): InternalComponent {
    const component = new InternalComponent();
    const output = Context({ renderSlot, with: config.with })
    initializeComponent(component, output.renderedTemplate)
    return component
}




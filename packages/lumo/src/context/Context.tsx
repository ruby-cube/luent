import { AnyObject } from "@rue/types";
import { Component, ComponentSetup, InternalComponent } from "../component/InternalComponent";
import { InferSlot, initializeComponent, makeComponent } from "../component/makeComponent";
import { getCurrentContext, popContext, pushContext } from "./context-stack";
import { ContextKeyMap, TypeConfig } from "./ContextKey";
import { DOG } from "./x_context-keys";
import { CAT } from "./x_context-keysB";
import { fromContext, AppContext, _ContextInputType } from "./provide";
import { ComponentConfig, NodeEntity } from "../node/makeNode";

export interface NodeContext {
    entries: AnyObject;
    parent: NodeContext | AppContext,
    root: AppContext,
    global?: AppContext,
}


type Slot = () => Component
// | NodeEntity[] | NodeEntity



type ContextEntries<T> = {
    [K in keyof T]: K extends keyof ContextKeyMap ? _ContextInputType<ContextKeyMap[K]> : any;
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
        root: parentContext?.root,
        global: parentContext?.global
    }

    pushContext(context)
    const nodeEntities = renderSlot()
    popContext()
    return Component(nodeEntities)
}

export function createNodeContext(
    Context: (input: {
        with: AnyObject;
        renderSlot: (() => NodeEntity | NodeEntity[]) | NodeEntity | NodeEntity[];
    }) => Component,
    renderSlot: () => NodeEntity | NodeEntity[],
    config: ComponentConfig,
): InternalComponent {
    const component = new InternalComponent();
    const output = Context({ renderSlot, with: config.with })
    initializeComponent(component, output.renderedTemplate)
    return component
}




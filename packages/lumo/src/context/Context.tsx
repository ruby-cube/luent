import { AnyObject } from "@rue/types";
import { getAttributes, prep } from "../component/getAttributes";
import { Component, ComponentSetup, InternalComponent } from "../component/InternalComponent";
import { v } from "../InputTypes";
import { InferSlot, initializeComponent, makeComponent } from "../component/makeComponent";
import { getCurrentContext, popContext, pushContext } from "./context-stack";
import { ContextKeyMap, TypeConfig } from "./ContextKey";
import { DOG } from "./context-keys";
import { CAT } from "./context-keysB";
import { fromContext, AppContext } from "./provide";
import { ComponentConfig, NodeEntity } from "../node/makeNode";

export interface NodeContext {
    entries: AnyObject;
    parent: NodeContext | AppContext,
    root: AppContext,
    global?: AppContext,
}


type Slot = () => Component
// | NodeEntity[] | NodeEntity

type Entries<T> = {
    [K in keyof T]: K extends keyof ContextKeyMap ? ContextKeyMap[K] extends { inputType: infer I } ? I : any : any
}



export function Context<T>(input: {
    with: { [K in keyof ContextEntries<T>]: ContextEntries<T>[K] },
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
    return nodeEntities
}

export function createContext(
    Context: ComponentSetup,
    renderSlot: () => NodeEntity | NodeEntity[],
    config: ComponentConfig,
): InternalComponent {
    const component = new InternalComponent();
    const renderedTemplate = Context({ renderSlot, with: config.with })
    initializeComponent(component, renderedTemplate)
    return component
}

function List() {
    return Component(
        <>
            <Context with={{ [DOG]: 'frog', [CAT]: 10 }}>
                <p>hello</p>
                <p>{appwide(DOG)}</p>
            </Context>

            <Context with={{ [DOG]: 'frog', [CAT]: 10 }}>
                <p>hello</p>
                <p>{fromContext(DOG)}</p>
            </Context>
        </>
    )
}

type ContextEntries<T> = {
    [K in keyof T]: K extends keyof ContextKeyMap ? ContextKeyMap[K] extends () => { inputType?: infer I } ? I : any : any
}
import { DerivedSignal, ReactiveSignal } from "@rue/muonic";
import { ConditionalRenderKit } from "./$if";
import { ComponentSetup, DOMNode, InternalComponent } from "./component";
import { getCurrentItemAndIndex, ListRenderKit } from "./forEachIn";
import { HTMLTag, makeElement } from "./mE";
import { ComponentConfig, makeComponent, RenderSlot, SlotRenderer } from "./mO";
import { _NodeRef, NodeRef } from "./NodeRef";
import { getNodeConfig } from "./setUpNode";
import { AnyObject } from "@rue/types";
import { onBeforeUnmount } from "./lifecycle";

export type NodeEntity = DOMNode | InternalComponent | ListRenderKit | ConditionalRenderKit[] | ConditionalRenderKit | any | ReactiveSignal<any> // TODO: Attach context (needs) to DOMNode, InternalComponent, ListRenderKit, and ConditionalKit

export type RenderFunction<Params = unknown> = Params extends [] ?
    (...args: Params) => NodeEntity[] | NodeEntity :
    () => NodeEntity[] | NodeEntity

export type EventHandler<K extends keyof HTMLElementEventMap> = (event: HTMLElementEventMap[K]) => void

export type EventsConfig = { 
    [K in keyof HTMLElementEventMap]?: EventHandler<K> | DerivedSignal<EventHandler<K>> | (EventHandler<K> | DerivedSignal<EventHandler<K>>)[] 
}

export type AssignedAttributes = {
    events: { [key: string]: (EventListener | DerivedSignal<EventListener>)[] };
    classes: (((o: DOMTokenList) => void) | string)[],
    styles: (((o: CSSStyleDeclaration) => void) | string)[],
    other: { [key: string]: (any | DerivedSignal<any>)[] }
}

export type NodeSetupConfig = {
    on?: EventsConfig
    class?: string | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[],
    style?: string | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[],
    assigned?: AssignedAttributes
}

export type JSXConfig<T extends HTMLElement | InternalComponent> = {
    [K in keyof HTMLElementEventMap as `on${K}`]?: (event: HTMLElementEventMap[K]) => void;
} & {
    class?: string;
    style?: string;
    ref?: NodeRef<T>,
}

export function makeNode(
    nodeType: HTMLTag | ComponentSetup,
    childNodes?: NodeEntity[] | RenderSlot,
    configA: (JSXConfig<HTMLElement>) | (JSXConfig<InternalComponent> & ComponentConfig) = {},
    configB?: NodeSetupConfig & (AnyObject | ComponentConfig),
): DOMNode | InternalComponent {
    const { ref } = configA;
    const nodeConfig = configB ?? _getNodeConfig(ref) ?? {};
    const [_, $index] = getCurrentItemAndIndex(); //TODO: I need to understand $index and whether it needs to be a signal or if rerenders will take care of it
    if (typeof nodeType === "string")
        return makeElement(
            nodeType,
            <NodeEntity[]>childNodes,
            <JSXConfig<HTMLElement>>configA,
            nodeConfig,
            <NodeRef<HTMLElement>>ref,
            $index
        )
    return makeComponent(
        nodeType,
        <SlotRenderer>childNodes,
        <JSXConfig<InternalComponent> & ComponentConfig>configA,
        nodeConfig,
        <NodeRef<InternalComponent>>ref,
        $index
    )
}

export function _getNodeConfig(ref: NodeRef | undefined) {
    if (ref) {
        const config = getNodeConfig(ref);
        if (config instanceof Function) {
            const [item, $index] = getCurrentItemAndIndex();
            const _config = config(item, $index!)
            return _config
        }
        return config;
    }
    return undefined;
}

export function initializeRef( // should this be initialize ref?
    component: InternalComponent,
    ref: _NodeRef,
    // options?: ElementOptions
) {
    if (ref.initialized === true) return; // to prevent registering multiple watchers for lists

    // if (dynamicClasses) {
    //     if (!ref) throw new Error(`nodeRef must be passed into mE to register dynamic classes`)
    //     setUpDynamicClasses(component, ref, dynamicClasses)
    // }

    // if (dynamicStyles) {
    //     if (!ref) throw new Error(`nodeRef must be passed into mE to register dynamic styles`)
    //     setUpDynamicStyles(component, ref, dynamicStyles)
    // }

    onBeforeUnmount(() => {
        ref.setValue(null);
    })

    ref.markInitialized()
}
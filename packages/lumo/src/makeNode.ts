import { DerivedSignal, ReactiveSignal } from "@rue/muonic";
import { ConditionalRenderKit } from "./$if";
import { Component, ComponentSetup, DOMNode, InternalComponent } from "./component";
import { getCurrentItemAndIndex, ListRenderKit } from "./forEachIn";
import { HTMLTag, makeElement } from "./mE";
import { makeComponent, InferSlotted } from "./mO";
import { _NodeRef, NodeRef } from "./NodeRef";
import { getNodeConfig } from "../api-play/_setUpNode";
import { AnyObject } from "@rue/types";
import { beforeUnmount } from "./lifecycle";

export function Fragment() {

}

export function jsx(tag: any, config: any, ...children: any[]) {
    return makeNode(tag, children, config || {})
}

export type NodeEntity = DOMNode | InternalComponent | ListRenderKit | ConditionalRenderKit[] | ConditionalRenderKit | any | ReactiveSignal<any> // TODO: Attach context (needs) to DOMNode, InternalComponent, ListRenderKit, and ConditionalKit

export type RenderFunction<Params = unknown> = Params extends [] ?
    (...args: Params) => NodeEntity[] | NodeEntity :
    () => NodeEntity[] | NodeEntity

export type EventHandler<K extends keyof HTMLElementEventMap> = (event: HTMLElementEventMap[K]) => void

export type EventsConfig = {
    [K in keyof HTMLElementEventMap]?: EventHandler<K> | DerivedSignal<EventHandler<K>> | (EventHandler<K> | DerivedSignal<EventHandler<K>>)[]
}

// export type AssignedAttributes = {
//     events: { [key: string]: (EventListener | DerivedSignal<EventListener | null>)[] };
//     classes: (((o: DOMTokenList) => void) | string)[],
//     styles: (((o: CSSStyleDeclaration) => void) | string)[],
//     other: { [key: string]: (any | DerivedSignal<any>)[] }
// }

export type ElementConfig<K extends HTMLTag = HTMLTag> = {
    [K in keyof HTMLElementEventMap as `on${K}`]?: (event: HTMLElementEventMap[K]) => void; } &
{
    class?: string | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[],
    style?: string | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[],
    attributes?: K extends HTMLTag ? ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[] : never,
} & NodeConfig<HTMLElementTagNameMap[K]>

type NodeConfig<T extends HTMLElement | InternalComponent> = {
    ref?: NodeRef<T extends HTMLElement ? T : T extends { component: infer C } ? C extends Component ? C : never : never>,
}

export type ComponentConfig<T extends ComponentSetup = ComponentSetup> = 
T extends (props: infer P) => any ? P & NodeConfig<InternalComponent> : never


export function makeNode(
    nodeType: HTMLTag | ComponentSetup,
    childNodes: NodeEntity[] | InferSlotted,
    config: ElementConfig | ComponentConfig,
): DOMNode | InternalComponent {
    const [_, $index] = getCurrentItemAndIndex(); //TODO: I need to understand $index and whether it needs to be a signal or if rerenders will take care of it
    if (typeof nodeType === "string")
        return makeElement(
            nodeType,
            <NodeEntity[]>childNodes,
            <ElementConfig>config,
            $index
        )
    return makeComponent(
        nodeType,
        <InferSlotted>childNodes,
        <ComponentConfig>config,
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

    beforeUnmount(() => {
        ref.setValue(null);
    })

    ref.markInitialized()
}
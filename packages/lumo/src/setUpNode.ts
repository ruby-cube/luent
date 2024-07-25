import { Component, ComponentSetup, InternalComponent } from "./component";
import { DOMNodeConfig, HTMLTag } from "./mE";
import { ComponentConfig } from "./mO";
import { NodeRef } from "./NodeRef";
import { ListData } from "./forEachIn";
import { Signal } from "../../muonic/useSignalize";
import { ReactiveSignal } from "../../muonic/useDerivedSignal";

// const xMainBlock = setUpNode('div', {
//     class: [
//     ],
//     on: {
//         click,
//         mousedown
//     }
// })

type Config<T extends HTMLTag | ComponentSetup = HTMLTag | ComponentSetup> = T extends HTMLTag ? DOMNodeConfig : ComponentConfig<T extends ComponentSetup ? T : never>
type ListConfig<
    T extends HTMLTag | ComponentSetup = HTMLTag | ComponentSetup,
    L extends ListData = ListData
> = L extends (infer I)[] ? (item: I, $index: Signal<number>) => Config<T>
    : L extends ReactiveSignal<infer I> ? (item: I, $index: Signal<number>) => Config<T> : never

const nodeConfigMap: WeakMap<NodeRef, DOMNodeConfig | ComponentConfig | ListConfig> = new WeakMap()

export function setUpNode<T extends HTMLTag | ComponentSetup>(
    nodeType: T,
    config: Config<T>
) {
    return _setUpNode(nodeType, config) as T extends HTMLTag ? NodeRef<HTMLElement> : NodeRef<Component>
}

export function getNodeConfig<T extends NodeRef>(nodeRef: T) {
    return nodeConfigMap.get(nodeRef)!
}

export function setUpNodesIn<T extends HTMLTag | ComponentSetup, L extends ListData>(
    list: L, // This is here for typing purposes only //TODO: should I use this to validate?
    nodeType: T,
    config: ListConfig<T, L>
) {
    return _setUpNode(nodeType, config) as T extends HTMLTag ? NodeRef<HTMLElement> : NodeRef<Component>
}

function _setUpNode(
    nodeType: HTMLTag | ComponentSetup,
    config: Config | ListConfig
): NodeRef {
    const nodeRef = new NodeRef(nodeType)
    nodeConfigMap.set(nodeRef, config)
    return nodeRef;
}

// const xItems = setUpNodesIn(list$, 'div', (item, i) => ({

// }))
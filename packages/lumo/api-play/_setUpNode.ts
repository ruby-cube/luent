import { Component, ComponentSetup, InternalComponent } from "../src/component/InternalComponent";
import { HTMLTag } from "../src/element/mE";
import { ComponentConfig } from "../src/component/mO";
import { NodeRef } from "../src/node/$Node";
import { ListData } from "../src/list/forEachIn";
import { Signal } from "@rue/muonic/useSignals";
import { ReactiveSignal } from "@rue/muonic/useDerivedSignal";
import { NodeSetupConfig, RenderFunction } from "../src/makeNode";

// const xMainBlock = setUpNode('div', {
//     class: [
//     ],
//     on: {
//         click,
//         mousedown
//     }
// })



type Config<T extends HTMLTag | ComponentSetup = HTMLTag | ComponentSetup> = T extends (props: infer P) => any ? {props: P} & NodeSetupConfig : NodeSetupConfig

// T extends HTMLTag ? NodeSetupConfig : ComponentConfig<T extends ComponentSetup ? T : never> & NodeSetupConfig
type ListSetup<
    T extends HTMLTag | ComponentSetup = HTMLTag | ComponentSetup,
    L extends ListData = ListData
> = L extends (infer I)[] ? (item: I, $index: Signal<number>) => Config<T>
    : L extends ReactiveSignal<infer I> ? (item: I, $index: Signal<number>) => Config<T> : never

const nodeConfigMap: WeakMap<NodeRef, NodeSetupConfig | ListSetup> = new WeakMap()

export function setUpNode<T extends HTMLTag | ComponentSetup>(
    nodeType: T,
    config: Config<T>
) {
    return _setUpNode(nodeType, config) as T extends HTMLTag ?
        NodeRef<
            //@ts-expect-error
            HTMLElementTagNameMap[T]
        > : NodeRef<Component>
}

export function getNodeConfig<T extends NodeRef>(nodeRef: T) {
    return nodeConfigMap.get(nodeRef)!
}

export function setUpNodesIn<T extends HTMLTag | ComponentSetup, L extends ListData>(
    list: L, // This is here for typing purposes only //TODO: should I use this to validate?
    nodeType: T,
    config: ListSetup<T, L>
) {
    return _setUpNode(nodeType, config) as T extends HTMLTag ?
        NodeRef<
            //@ts-expect-error
            HTMLElementTagNameMap[T]
        > : NodeRef<Component>
}

function _setUpNode(
    nodeType: HTMLTag | ComponentSetup,
    config: Config | ListSetup
): NodeRef {
    const nodeRef = new NodeRef(nodeType)
    nodeConfigMap.set(nodeRef, config)
    return nodeRef;
}

// const xItems = setUpNodesIn(list$, 'div', (item, i) => ({

// }))
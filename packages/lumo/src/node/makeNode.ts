import { DerivedIon, ReactiveGet, ion, IonicModel, __devCheckIfTracked, __devCheckIfNotTracked, AtomicIon } from "../../../quarky/src";
import { ComponentSetup, DOMNode, InternalComponent } from "../component/InternalComponent";
import { HTMLTag, makeElement } from "../element/makeElement";
import { InferSlot, ComponentSetupWithSlot, makeComponent } from "../component/makeComponent";
import { getNodeArrayRef, InternalNodeRef, NodeReferent, NodeRef, InternalNodeArrayRef, NodesIon, getNodeRef } from "./NodeRef";
import { getFlask, onFlaskDisposal } from "@rue/flask";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { getCurrentIndex, ListRenderKit } from "../iteratives/ListRenderKit";
import { createNodeContext } from "../context/Context";

export function Fragment() {
    // for jsx-runtime
}

export function jsx(tag: any, config: any, ...children: any[]) {
    return makeNode(tag, () => children, config || {})
}

export type NodeEntity = NodeEntity[] | DOMNode | InternalComponent | ListRenderKit | ConditionalRenderKit[] | ConditionalRenderKit | any | ReactiveGet<any> // TODO: Attach context (needs) to DOMNode, InternalComponent, ListRenderKit, and ConditionalKit

export type RenderFunction<Params = unknown> = Params extends [] ?
    (...args: Params) => NodeEntity[] | NodeEntity :
    () => NodeEntity[] | NodeEntity

export type EventHandler<K extends keyof HTMLElementEventMap> = (event: HTMLElementEventMap[K]) => void

export type EventsConfig = {
    [K in keyof HTMLElementEventMap]?: EventHandler<K> | EventHandler<K>[]
}

// export type AssignedAttributes = {
//     events: { [key: string]: (EventListener | DerivedIon<EventListener | null>)[] };
//     classes: (((o: DOMTokenList) => void) | string)[],
//     styles: (((o: CSSStyleDeclaration) => void) | string)[],
//     other: { [key: string]: (any | DerivedIon<any>)[] }
// }

export type ElementConfig<K extends HTMLTag = HTMLTag> = {
    [K in keyof HTMLElementEventMap as `on${K}`]?: (event: HTMLElementEventMap[K]) => void; } &
{
    class?: string | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[],
    style?: string | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[],
    attributes?: K extends HTMLTag ? ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[] : never,
} & NodeSetup<K>

type NodeSetup<T extends HTMLTag | ComponentSetup> = {
    ref?: NodeRef<T>,
}

export type ComponentConfig<T extends ComponentSetup = ComponentSetup> =
    T extends (props: infer P) => any ? P & NodeSetup<T> : T extends () => any ? NodeSetup<T> : never


export function makeNode(
    nodeType: HTMLTag | ComponentSetup,
    renderSlot: (() => NodeEntity[]) | InferSlot,
    config: ElementConfig | ComponentConfig,
): DOMNode | InternalComponent {
    if (typeof nodeType === "string")
        return makeElement(
            nodeType,
            <() => NodeEntity[]>renderSlot,
            <ElementConfig>config,
            getCurrentIndex()
        )
    if (nodeType.name === 'Context') {
        if (!renderSlot) throw new Error(`Extraneous <Context>`)
        return createNodeContext(nodeType, renderSlot, <ComponentConfig>config)
    }
    return makeComponent(
        nodeType,
        <InferSlot>renderSlot,
        <ComponentConfig>config,
        getCurrentIndex()
    )
}

// export function _getNodeConfig(ref: NodeRef | undefined) {
//     if (ref) {
//         const config = getNodeConfig(ref);
//         if (config instanceof Function) {
//             const [item, $index] = getCurrentIndex();
//             const _config = config(item, $index!)
//             return _config
//         }
//         return config;
//     }
//     return undefined;
// }

export function initializeListRef( // should this be initialize ref?
    ref: NodesIon,
    value: NodeReferent | undefined,
    $index: AtomicIon<number>
    // options?: ElementOptions
) {
    // if (__DEV__) __devCheckIfNotTracked()
    if (__DEV__) __devCheckIfTracked()
    // const array = ref()!
    const _ref = getNodeArrayRef(ref())
    if (!_ref) throw new Error(`No internal node ref found. This should never happen`)
    // if ($index() === 0 && _existingRef)
    // throw new Error('This node list ref has already be initialized. A node list ref cannot be used multiple times')
    // const _ref = _existingRef || new InternalNodeArrayRef(ref)
    if (value) {
        _ref.assignValue(value, $index);
    }

    // if (_ref.initialized === true) return; // to prevent registering multiple watchers for lists

    // // dispose with outer flask because we don't want to dispose when first item is removed
    // const outerFlask = getFlask()?.outer
    // outerFlask?.onDisposal(() => {
    //     _ref.setValue([]);
    //     _ref.initialized = false;
    // })

    // if (isSettingUpList() && !__SSR__) {
    //     onListUpdated((toFromIndices) => {
    //         _ref.updateListRef(toFromIndices)
    //     }, { until: outerFlask!.onDisposal })
    // }

    // _ref.markInitialized()
}

export function initializeRef(ref: NodeRef, value: NodeReferent | undefined) {
    // if (__DEV__) __devCheckIfNotTracked()
    if (__DEV__) __devCheckIfTracked()
    if (ref())
        throw new Error("Node ref has already been assigned. A node ref can only be associated with a single dom node or component instance")
    const _ref = new InternalNodeRef(ref)
    if (value) {
        _ref.assignValue(value)
        const flask = getFlask()
        flask?.onDisposal(() => {
            _ref.setValue(undefined);
        })
    }
}

// export function useInternalNodeRef(ref: NodeRef | IonicModel<any[]>) {
//     const refValue = ref()
//     return refValue instanceof Array ? getNodeArrayRef(refValue) || new InternalNodeArrayRef(ref) : new InternalNodeRef(ref)
// }

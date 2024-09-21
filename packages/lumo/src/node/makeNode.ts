import { DerivedIon, ReactiveGet, AtomicIon, getWithoutTracking, $Derived, ReactiveModel } from "@rue/muonic";
import { ComponentSetup, DOMNode, InternalComponent } from "../component/InternalComponent";
import { HTMLTag, makeElement } from "../element/makeElement";
import { makeComponent, InferSlot, ComponentSetupWithSlot } from "../component/makeComponent";
import { getNodeArrayRef, InternalNodeRef, NodeReferent, NodeIon, InternalNodeArrayRef, NodesIon, getNodeIon } from "./$Node";
import { getFlask, onFlaskDisposal } from "@rue/flask";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { getCurrentIndex, ListRenderKit } from "../list/ListRenderKit";
import { isSettingUpList, onListUpdated } from "../list/listStack";
import { watch } from "../watch/watchAndPreserve";
import { WatchOptions } from "vite";

export function Fragment() {
    // for jsx-runtime
}

export function jsx(tag: any, config: any, ...children: any[]) {
    return makeNode(tag, children, config || {})
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
    ref?: NodeIon<T>,
}

export type ComponentConfig<T extends ComponentSetup = ComponentSetup> =
    T extends (props: infer P) => any ? P & NodeSetup<T> : T extends () => any ? NodeSetup<T> : never


export function makeNode(
    nodeType: HTMLTag | ComponentSetup,
    childNodes: NodeEntity[] | InferSlot,
    config: ElementConfig | ComponentConfig,
): DOMNode | InternalComponent {
    const $index = getCurrentIndex(); //TODO: I need to understand $index and whether it needs to be an ion or if rerenders will take care of it
    if (typeof nodeType === "string")
        return makeElement(
            nodeType,
            <NodeEntity[]>childNodes,
            <ElementConfig>config,
            $index
        )
    return makeComponent(
        nodeType,
        <InferSlot>childNodes,
        <ComponentConfig>config,
        $index
    )
}

// export function _getNodeConfig(ref: NodeIon | undefined) {
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
    const array = ref()!
    const _existingRef = getNodeArrayRef(array)
    if (getWithoutTracking($index) === 0 && _existingRef) //QUESTION: Not sure if get without tracking is necessary
        throw new Error('This node list ref has already be initialized. A node list ref cannot be used multiple times')
    const _ref = _existingRef || new InternalNodeArrayRef(ref)
    if (value) {
        _ref.assignValue(value, $index);
    }
    if (_ref.initialized === true) return; // to prevent registering multiple watchers for lists

    // dispose with outer flask because we don't want to dispose when first item is removed
    const outerFlask = getFlask()?.outer
    outerFlask?.onDisposal(() => {
        _ref.setValue([]);
        _ref.initialized = false;
    })

    if (isSettingUpList() && !__SSR__) {
        onListUpdated((toFromIndices) => {
            _ref.updateListRef(toFromIndices)
        }, { flask: outerFlask })
    }

    _ref.markInitialized()
}

export function initializeRef(ref: NodeIon, value: NodeReferent | undefined) {
    if (getWithoutTracking(ref)) //QUESTION: Not sure if get without tracking is necessary
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

// export function useInternalNodeRef(ref: NodeIon | ReactiveModel<any[]>) {
//     const refValue = ref()
//     return refValue instanceof Array ? getNodeArrayRef(refValue) || new InternalNodeArrayRef(ref) : new InternalNodeRef(ref)
// }

import { DerivedSignal, AnySignal, AtomicSignal } from "@rue/muonic";
import { ComponentSetup, DOMNode, InternalComponent } from "../component/InternalComponent";
import { HTMLTag, makeElement } from "../element/makeElement";
import { makeComponent, InferSlot, ComponentSetupWithSlot } from "../component/makeComponent";
import { getNodeRef, InternalNodeRef, NodeReferent, NodeSignal } from "./$Node";
import { getFlask, onFlaskDisposal } from "@rue/flask";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { getCurrentIndex, ListRenderKit } from "../list/ListRenderKit";
import { isSettingUpList, onListUpdated } from "../list/listStack";

export function Fragment() {
    // for jsx-runtime
}

export function jsx(tag: any, config: any, ...children: any[]) {
    return makeNode(tag, children, config || {})
}

export type NodeEntity = NodeEntity[] | DOMNode | InternalComponent | ListRenderKit | ConditionalRenderKit[] | ConditionalRenderKit | any | AnySignal<any> // TODO: Attach context (needs) to DOMNode, InternalComponent, ListRenderKit, and ConditionalKit

export type RenderFunction<Params = unknown> = Params extends [] ?
    (...args: Params) => NodeEntity[] | NodeEntity :
    () => NodeEntity[] | NodeEntity

export type EventHandler<K extends keyof HTMLElementEventMap> = (event: HTMLElementEventMap[K]) => void

export type EventsConfig = {
    [K in keyof HTMLElementEventMap]?: EventHandler<K> | EventHandler<K>[]
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
} & NodeSetup<K>

type NodeSetup<T extends HTMLTag | ComponentSetup> = {
    ref?: NodeSignal<T>,
}

export type ComponentConfig<T extends ComponentSetup = ComponentSetup> =
    T extends (props: infer P) => any ? P & NodeSetup<T> : T extends ()=>any ? NodeSetup<T> : never


export function makeNode(
    nodeType: HTMLTag | ComponentSetup,
    childNodes: NodeEntity[] | InferSlot,
    config: ElementConfig | ComponentConfig,
): DOMNode | InternalComponent {
    const $index = getCurrentIndex(); //TODO: I need to understand $index and whether it needs to be a signal or if rerenders will take care of it
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

// export function _getNodeConfig(ref: NodeSignal | undefined) {
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
    ref: NodeSignal,
    value: NodeReferent,
    $index: AtomicSignal<number>
    // options?: ElementOptions
) {
    const _ref = useInternalNodeRef(ref)
    _ref.assignValue(value, $index);
    if (_ref.initialized === true) return; // to prevent registering multiple watchers for lists

    // dispose with outer flask because we don't want to dispose when first item is removed
    const outerFlask = getFlask()?.outer
    outerFlask?.onDisposal(() => {
        _ref.setValue(undefined);
        _ref.initialized = false;
    })

    if (isSettingUpList() && !__SSR__) {
        const listUpdatedListener =
            onListUpdated((toFromIndices) => {
                _ref.updateListRef(toFromIndices)
            }, { flask: outerFlask })
    }

    _ref.markInitialized()
}

export function initializeRef(ref: NodeSignal, value: NodeReferent | null) {
    const _ref = useInternalNodeRef(ref);
    _ref.assignValue(value)
    const flask = getFlask()
    flask?.onDisposal(() => {
        _ref.setValue(undefined);
    })
}

export function useInternalNodeRef(ref: NodeSignal) {
    const refValue = ref()
    return refValue instanceof Array ? getNodeRef(refValue) || new InternalNodeRef(ref) : new InternalNodeRef(ref)
}
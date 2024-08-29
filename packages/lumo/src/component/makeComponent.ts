import { PublicComponent, ComponentSetup, InternalComponent, COMPONENT, Component } from "./InternalComponent";
import { InternalNodeRef, NodeSignal, getNodeRef, get$Node } from "../node/$Node";
import { ComponentConfig, EventsConfig, initializeListRef, initializeRef, makeNode, NodeEntity, RenderFunction } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { DerivedSignal, Signal } from "@rue/muonic";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { getCurrentComponent, popComponent, pushComponent } from "./componentStack";
import { LifecycleHook } from "./lifecycle";
import { getCurrentItemAndIndex } from "../list/ListRenderKit";

// on: T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;

export type ComponentOptions = { preserve?: true }

export type InferSlot<T extends ComponentSetup = ComponentSetup> =
    T extends (props: infer P) => any ?
    P extends { Slot: infer S } ?
    S
    : undefined
    : undefined

export type PropsWithSlot = {
    Slot: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
}

export type ComponentSetupWithSlot<P extends PropsWithSlot = PropsWithSlot> =
    (props: P) => NodeEntity[] | NodeEntity


// export function mO<T extends ComponentSetupWithSlot>(
//     Component: T,
//     Slot: InferSlot<T>,
//     config?: ComponentConfig<T>
// ): InternalComponent
// export function mO<T extends ComponentSetup>(
//     Component: T,
//     Slot?: undefined,
//     config?: ComponentConfig<T>
// ): InternalComponent
export function mO<T extends ComponentSetup>(
    Component: T,
    Slot: InferSlot<T>,
    config?: ComponentConfig<T>
): InternalComponent {
    const [_, $index] = getCurrentItemAndIndex()
    return makeComponent(Component, Slot, config || {}, $index)
}

export function makeComponent(
    Component: ComponentSetup,
    Slot: InferSlot | undefined,
    config: ComponentConfig,
    $index: Signal<number> | undefined
): InternalComponent {
    const parent = getCurrentComponent<InternalComponent>();
    const component = new InternalComponent(parent);
    pushComponent(component)
    runComponentSetup(Component, component, Slot, config, $index);
    component.emit(LifecycleHook.AFTER_CREATE)
    popComponent() // for sibling components to access parent, must be set AFTER `Component()`
    return component;
}

// on?: { [key: string]: ((e: Event, index: number) => void) | ((e: Event) => void) } //TODO: limit to web events
// class?: string;
// style?: { [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] };
// $class?: ((o: DOMTokenList) => void)[],
// $style?: ((o: CSSStyleDeclaration) => void)[],
// ref?: NodeSignal,
// $index?: Signal<number>





// export function getAttributes() {
//     const component = getCurrentComponent();
//     if (!component) throw new Error('`getAttributes` can only be called from within component setup')
//     const attributes = component.attributes;
//     component.attributes = null;
//     return attributes!
// }

function normalizeToFragmentArray(entity: any) { // distinguish conditional series from 
    if (entity instanceof ConditionalRenderKit) return [[entity]];
    if (entity instanceof Array) { // check if conditional series
        if (entity[0] instanceof ConditionalRenderKit) return [entity];
        return entity;
    }
    return normalizeToArray(entity);
}

function extractNodeEntities(component: Component) {
    if (!('initialNodeEntities' in component))
        throw new Error('Component setup must return a Component. Pass jsx into `mx` function')
    return component.initialNodeEntities;
    // if (!(output instanceof Array)) return output;
    // if (output.length === 2
    //     && output[0] instanceof Object
    //     && COMPONENT in output[0]
    // ) {
    //     return output.pop();
    // }
    // return output;
}

export function runComponentSetup(
    Component: ComponentSetup,
    component: InternalComponent,
    Slot: InferSlot | undefined,
    config: ComponentConfig,
    $index: Signal<number> | undefined
) {
    const output = Component({ ...config, Slot })
    if (output instanceof Promise)
        throw new Error("Components cannot return a promise. Use $Suspense and $await to handle promises within component setup")

    initializeComponent(component, output, config.ref, $index)
}

function initializeComponent(
    component: InternalComponent,
    output: Component,
    ref: NodeSignal | undefined,
    $index: Signal<number> | undefined,
) {
    const nodeEntities = normalizeToFragmentArray(extractNodeEntities(output)); //TODO: Validate output and get publicComponent from output

    component.initialNodeEntities = nodeEntities;

    if (ref) {
        const publicComponent = output.component || null;
        if ($index) initializeListRef(ref, publicComponent, $index)
        else initializeRef(ref, publicComponent)
    }

}


// export function composeEvents(
//     events: { [key: string]: Function | Function[] }[],
// ) {
//     const target: { [key: string]: Function[] } = {};
//     for (const _events of events) {
//         for (const key in _events) {
//             const value = _events[key];
//             if (key in target) {
//                 const handlers = target[key];
//                 if (value instanceof Array) {
//                     handlers.push(...value);
//                 }
//                 else {
//                     handlers.push(value)
//                 }
//             }
//             else {
//                 if (value instanceof Array) {
//                     target[key] = [...value]
//                 }
//                 else {
//                     target[key] = [value]
//                 }
//             }
//         }
//     }
//     return target as { [key: string]: (EventListener | DerivedSignal<EventListener | null>)[] };
// }

// function assignAttributes(nodeEntity: NodeEntity, attributes: AssignedAttributes) {
//     if (nodeEntity instanceof Element) { // from Web API
//         applyAttributes(nodeEntity, attributes);
//     }
//     else if (nodeEntity instanceof InternalComponent) {
//         assignAttributes(nodeEntity.nodeEntities[0], attributes)
//     }
//     else if (__DEV__) {
//         console.warn('assigned attributes cannot be automatically applied. Please assign manually.')
//     }
// }



// export function warnOverlappingKeys(propsA: AnyObject, propsB: AnyObject | undefined, propsC?: AnyObject) {
//     if (!propsC && !propsB) return;
//     if (propsC) {
//         for (const key in propsA) {
//             if (key in propsC) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
//         }
//         if (!propsB) return;
//         for (const key in propsA) {
//             if (key in propsB) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
//         }
//         for (const key in propsB) {
//             if (key in propsC) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
//         }
//     }
//     else if (propsB) {
//         for (const key in propsA) {
//             if (key in propsB) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
//         }
//     }
// }





// function setUpRefUpdates(ref: InternalNodeRef, component: Component, $index: Signal<number> | undefined, preserve: boolean) {
//     if (ref.initialized === true) return;
//     // if ($index) { // only initiate once per list
//     //     const components = ref.components;
//     //     if (preserve) {
//     //         onDeactivated(() => {
//     //             ref.components = null;
//     //         })
//     //         onActivated(() => {
//     //             ref.components = components
//     //         })
//     //     }
//     //     beforeUnmount(() => {
//     //         ref.components = null;
//     //     })
//     // }
//     // else {
//     if (preserve) {
//         onDeactivated(() => {
//             ref.setValue(null)
//         })
//         onActivated(() => {
//             ref.setValue(component)
//         })
//     }

//     beforeUnmount(() => {
//         ref.setValue(null);
//     })
//     // }
//     ref.markInitialized();
// }


// export function mountComponent(parent: Element, component: InternalComponent) {
//     component.emit(LifecycleHook.BEFORE_MOUNT);
//     parent.append(...component.domNodes);
//     component.emit(LifecycleHook.MOUNTED);
// }

// export function unmountComponent(component: InternalComponent) {
//     component.emit(LifecycleHook.BEFORE_UNMOUNT);
//     // const nodes = component.nodeEntities;
//     // for (const node of nodes) {
//     //     node.remove();
//     // }
//     component.emit(LifecycleHook.UNMOUNTED);
// }


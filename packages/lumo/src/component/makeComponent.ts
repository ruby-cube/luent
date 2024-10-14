import { ComponentSetup, InternalComponent, Component, ProviderComponentSetup, PublicComponent } from "./InternalComponent";
import { NodeRef } from "../node/NodeRef";
import { ComponentConfig, initializeListRef, initializeRef, NodeEntity } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { getCurrentIndex } from "../iteratives/ListRenderKit";
import { getProviderComponent, popProvider, provide, pushProvider } from "./provide";
import { MorphicRenderKit } from "../morphic/MorphicComponent";
import { IonicModel, isIon, protect, Ion } from "@rue/quarky";
import { AnyObject } from "@rue/types";
import { getFlask } from "@rue/flask";

// on: T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;

export type ComponentOptions = { preserve?: true }

export type InferSlot<T extends ComponentSetup = ComponentSetup> =
    T extends (setup: infer P) => any ?
    P extends { Slot: infer S } ?
    S
    : undefined
    : undefined

export type SetupWithSlot = {
    Slot: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
}

export type ComponentSetupWithSlot<P extends SetupWithSlot = SetupWithSlot> =
    (setup: P) => NodeEntity[] | NodeEntity


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
): InternalComponent | MorphicRenderKit {
    const $index = getCurrentIndex()
    // if (Component.length === 2) return makeProviderComponent(Component, Slot, config || {}, $index)
    return makeComponent(Component, Slot, config || {}, $index)
}

// export function makeComponent(
//     Component: ComponentSetup,
//     Slot: InferSlot | undefined,
//     config: ComponentConfig,
//     $index: Ion<number> | undefined
// ): InternalComponent {
//     const output = Component(protectSetupProps(config, Slot))
//     const component = 'morphicRenderKit' in output ? output.morphicRenderKit as MorphicRenderKit : new InternalComponent();
//     initializeComponent(component, output, config.ref, $index)
//     return component;
// }

export function protectSetupProps(config: ComponentConfig, Slot?: InferSlot | undefined) {
    const setupProps = { Slot } as AnyObject
    for (const key in config) {
        const value = config[key]
        setupProps[key] = protect(value)
    }
    return setupProps
}

let activeComponent: InternalComponent | undefined;

export function getActiveComponent() {
    return activeComponent;
}

export function makeComponent(
    Component: ComponentSetup,
    Slot: InferSlot | undefined,
    config: ComponentConfig,
    $index: Ion<number> | undefined
): InternalComponent | MorphicRenderKit {
    const provider = getProviderComponent();
    const component = new InternalComponent(provider, provider.global, provider.root);

    activeComponent = component; // for `provide` to make component into provider
    pushProvider(provider)
    const output = Component(protectSetupProps(config, Slot))
    popProvider()

    if (output instanceof Promise)
        throw new Error("Components cannot return a promise. Use Suspense and suspendRender to handle promises within component setup")

    const { publicComponent, render, morphicRenderKit } = output
    pushProvider(component.entries ? component : provider)
    const rendered = unnestComponent(output.render())
    popProvider()

    activeComponent = undefined;
    initializeComponent(component, publicComponent, rendered, config.ref, $index)
    return morphicRenderKit ? morphicRenderKit : component
}

function unnestComponent(nodeEntities: NodeEntity[]) {
    if (nodeEntities.length !== 1)
        return nodeEntities;
    if (nodeEntities[0] instanceof InternalComponent) {
        const component = nodeEntities[0]
        if (!component.component || !component.initialNodeEntities)
            return nodeEntities;
        return component.initialNodeEntities;
    }
    return nodeEntities
}
// export function runProviderComponentSetup(
//     Component: ProviderComponentSetup,
//     component: InternalComponent,
//     Slot: InferSlot | undefined,
//     config: ComponentConfig,
//     $index: Ion<number> | undefined
// ) {
//     const output = Component(protectSetupProps(config, Slot), provide)
//     initializeComponent(component, output, config.ref, $index)
// }


export function initializeComponent(
    component: InternalComponent,
    publicComponent: PublicComponent | undefined,
    rendered: NodeEntity | NodeEntity[],
    ref: NodeRef | IonicModel<any[]> | undefined,
    $index: Ion<number> | undefined,
) {
    const nodeEntities = normalizeToFragmentArray(rendered); //TODO: Validate output and get publicComponent from out
    component.initialNodeEntities = nodeEntities;
    if (ref) {
        if (!isIon(ref)) throw new Error("INVALID INPUT: Must use NodeRef or NodesRef ion as ref")
        if ($index) {
            initializeListRef(ref, publicComponent, $index)
        }
        else {
            initializeRef(ref, publicComponent)
        }
    }
}



// on?: { [key: string]: ((e: Event, index: number) => void) | ((e: Event) => void) } //TODO: limit to web events
// class?: string;
// style?: { [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] };
// $class?: ((o: DOMTokenList) => void)[],
// $style?: ((o: CSSStyleDeclaration) => void)[],
// ref?: NodeRef,
// $index?: Ion<number>





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
        throw new Error('Component setup must return a Component. Pass jsx into `Component` function')
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
//     return target as { [key: string]: (EventListener | DerivedIon<EventListener | null>)[] };
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





// function setUpRefUpdates(ref: InternalNodeRef, component: Component, $index: Ion<number> | undefined, preserve: boolean) {
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


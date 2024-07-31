import { AnyObject } from "@rue/types";
import { PublicComponent, ComponentSetup, getCurrentComponent, InternalComponent, popComponent, pushComponent, COMPONENT } from "./component";
import { SetKey, Signal } from "@rue/muonic/useSignalize";
import { collectEffects } from "@rue/flask/flask";
import { InternalNodeRef, getNodeRef, NodeRef } from "../node/NodeRef";
import { ComponentConfig, EventsConfig, initializeRef, makeNode, NodeEntity, RenderFunction } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { isHTMLEvent } from "../html/attributes";
import { DerivedSignal } from "@rue/muonic";
import { ConditionalRenderKit, preserveAllRequested } from "../conditional/$if";
import { beforeUnmount, LifecycleHook, onActivated, onDeactivated, onUnmounted } from "./lifecycle";

// on: T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;

export type ComponentOptions = { preserve?: true }

export type InferSlotted<T extends ComponentSetupWithSlot = ComponentSetupWithSlot> =
    T extends (props: infer P) => any ?
    P extends { slotted: infer S } ?
    S
    : undefined
    : undefined

export type PropsWithSlot = {
    slot: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
}

type ComponentSetupWithSlot<P extends PropsWithSlot = PropsWithSlot> =
    (props: P) => NodeEntity[] | NodeEntity


export function mO<T extends ComponentSetupWithSlot>(
    Component: T,
    slotted: InferSlotted<T>,
    config?: ComponentConfig<T>
): InternalComponent
export function mO<T extends ComponentSetup>(
    Component: T,
    slotted?: InferSlotted<T> | undefined,
    config?: ComponentConfig<T>
): InternalComponent {
    return makeNode(Component, slotted, config || {}) as InternalComponent
}

export function makeComponent(
    Component: ComponentSetup,
    slotted: InferSlotted | undefined,
    config: ComponentConfig,
    $index: Signal<number> | undefined
): InternalComponent {
    const parent = getCurrentComponent();
    const preserve = getPreserveStatus(parent);
    const component = new InternalComponent(parent, preserve);
    pushComponent(component)
    runComponentSetup(Component, component, slotted, config, $index);
    popComponent() // for sibling components to access parent, must be set AFTER `Component()`
    return component;
}

// on?: { [key: string]: ((e: Event, index: number) => void) | ((e: Event) => void) } //TODO: limit to web events
// class?: string;
// style?: { [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] };
// $class?: ((o: DOMTokenList) => void)[],
// $style?: ((o: CSSStyleDeclaration) => void)[],
// ref?: NodeRef,
// $index?: Signal<number>



function getPreserveStatus(
    // options: ComponentOptions | undefined,
    parent: InternalComponent | null,
) {
    // let preserveRequested: boolean | undefined = options && options.preserve;
    // if (preserveRequested && !isSettingUpConditionalMount()) {
    //     preserveRequested = false;
    //     if (__DEV__) console.warn('Extraneous preserve component request. Preserve component only within conditional `ifCase(condition, { mount: () => {} })` or `mountIf`')
    // }

    return preserveAllRequested() || !!parent && parent.preserve;
}

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

function extractNodeEntities(output: NodeEntity | NodeEntity[] | [PublicComponent, NodeEntity | NodeEntity[]]) {
    if (!(output instanceof Array)) return output;
    if (output.length === 2
        && output[0] instanceof Object
        && COMPONENT in output[0]
    ) {
        return output.pop();
    }
    return output;
}

function runComponentSetup(
    Component: ComponentSetup,
    component: InternalComponent,
    slotted: InferSlotted | undefined,
    config: ComponentConfig,
    $index: Signal<number> | undefined
) {
    collectEffects((flask, outerFlask) => {
        const ref = config.ref as NodeRef<ComponentSetup | ComponentSetup[]>

        const nodeEntities = normalizeToFragmentArray(extractNodeEntities(Component({ ...config, slotted })));

        component.nodeEntities = nodeEntities;

        if (ref) {
            const _ref = ref.o instanceof Array ? getNodeRef(ref.o)! : new InternalNodeRef(ref)
            const publicComponent = component.component || null;
            _ref.assignValue(publicComponent, $index)
            // setUpRefUpdates(_ref, publicComponent, $index, component.preserve)
            initializeRef(component, _ref)
        }

        // if (component.attributes) { // if `getAttributes` is called, this will be null
        //     // fallthrough attributes onto root or first node
        //     assignAttributes(nodeEntities[0], component.attributes);
        //     component.attributes = null;
        // }

        outerFlask?.onDisposal(flask.dispose) // no outer flask means it's the root component

        // set up hook cascade
        const parent = component.parent;
        if (parent instanceof InternalComponent) {
            beforeUnmount(() => component.emit(LifecycleHook.BEFORE_UNMOUNT), parent) //TODO: how do these get cleaned up?
            onUnmounted(() => component.emit(LifecycleHook.UNMOUNTED), parent)
            onDeactivated(() => component.emit(LifecycleHook.DEACTIVATED), undefined, parent)
            onActivated(() => component.emit(LifecycleHook.ACTIVATED), undefined, parent)
        }
    })
}


export function composeEvents(
    events: { [key: string]: Function | Function[] }[],
) {
    const target: { [key: string]: Function[] } = {};
    for (const _events of events) {
        for (const key in _events) {
            const value = _events[key];
            if (key in target) {
                const handlers = target[key];
                if (value instanceof Array) {
                    handlers.push(...value);
                }
                else {
                    handlers.push(value)
                }
            }
            else {
                if (value instanceof Array) {
                    target[key] = [...value]
                }
                else {
                    target[key] = [value]
                }
            }
        }
    }
    return target as { [key: string]: (EventListener | DerivedSignal<EventListener | null>)[] };
}

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



export function warnOverlappingKeys(propsA: AnyObject, propsB: AnyObject | undefined, propsC?: AnyObject) {
    if (!propsC && !propsB) return;
    if (propsC) {
        for (const key in propsA) {
            if (key in propsC) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
        }
        if (!propsB) return;
        for (const key in propsA) {
            if (key in propsB) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
        }
        for (const key in propsB) {
            if (key in propsC) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
        }
    }
    else if (propsB) {
        for (const key in propsA) {
            if (key in propsB) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
        }
    }
}

export function analyzeAttributes(entries: AnyObject) {
    const events: AnyObject = {};
    // const jsxProps: AnyObject = {};
    const attributes: AnyObject = {};
    for (const key in entries) {
        if (key === "children") {
            continue;
        }
        else if (isHTMLEvent(key)) {
            events[key.slice(2)] = entries[key];
        }
        // else if (isHTMLAttribute(key, tag)) {
        // }
        else {
            attributes[key] = entries[key];
            // jsxProps[key] = jsxEntries[key];
        }
    }
    return {
        attributes,
        events,
        // jsxProps
    }
}



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

export function unmountComponent(component: InternalComponent) {
    component.emit(LifecycleHook.BEFORE_UNMOUNT);
    // const nodes = component.nodeEntities;
    // for (const node of nodes) {
    //     node.remove();
    // }
    component.emit(LifecycleHook.UNMOUNTED);
}


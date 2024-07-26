import { AnyObject } from "@rue/types";
import { Component, ComponentSetup, getCurrentComponent, InternalComponent, popComponent, pushComponent } from "./component";
import { SetKey, Signal } from "../../muonic/useSignalize";
import { LifecycleHook, onActivated, onBeforeUnmount, onDeactivated, onUnmounted } from "./lifecycle";
import { collectEffects } from "@rue/flask/flask";
import { _NodeRef, NodeRef } from "./NodeRef";
import { preserveAllRequested } from "../api-play/mountIf";
import { AssignedAttributes, EventsConfig, initializeRef, JSXConfig, makeNode, NodeEntity, NodeSetupConfig, RenderFunction } from "./makeNode";
import { normalizeToArray } from "@rue/utils";
import { isHTMLEvent } from "./html/attributes";
import { applyAttributes } from "./mE";
import { DerivedSignal } from "@rue/muonic";

// on: T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;
export type ComponentConfig<T extends ComponentSetup<AnyObject> = ComponentSetup> = {
    props?: T extends (props: infer P) => any ? { [K in keyof P]?: P[K] } : never;
}

export type RenderSlot<T extends ComponentSetupWithSlot = ComponentSetupWithSlot> =
    T extends (props: infer P) => any ?
    P extends { slot: infer R } ?
    R : undefined : undefined

export type ComponentOptions = { preserve?: true }

export type SlotRenderer = { slot: RenderFunction | ((props: AnyObject) => NodeEntity[] | NodeEntity) | { [key: string]: RenderFunction | ((props: AnyObject) => NodeEntity[] | NodeEntity) } }

type ComponentSetupWithSlot<P extends SlotRenderer = SlotRenderer> = (props: P) => NodeEntity[] | NodeEntity


export function mO<T extends ComponentSetupWithSlot>(
    Component: T,
    slot: RenderSlot<T>,
    jsxConfig?: T extends (props: infer P) => any ? P : never & JSXConfig<InternalComponent>,
    setupConfig?: ComponentConfig<T extends (props: AnyObject) => any ? T : never> & NodeSetupConfig
): InternalComponent
export function mO<T extends ComponentSetup>(
    Component: T,
    slot?: RenderSlot<T>,
    jsxConfig?: T extends (props: infer P) => any ? P : never & JSXConfig<InternalComponent>,
    setupConfig?: ComponentConfig<T> & NodeSetupConfig
): InternalComponent {
    return makeNode(Component, slot, jsxConfig, setupConfig) as InternalComponent
}

export function makeComponent(
    Component: ComponentSetup,
    slot: SlotRenderer | undefined,
    jsxConfig: JSXConfig<InternalComponent>,
    setupConfig: ComponentConfig & NodeSetupConfig,
    ref: NodeRef<InternalComponent> | undefined,
    $index: Signal<number> | undefined
): InternalComponent {
    const parent = getCurrentComponent();
    if (!parent) throw new Error("No parent component")

    const preserve = getPreserveStatus(parent);

    const component = new InternalComponent(parent, preserve);
    pushComponent(component)
    runComponentSetup(Component, component, slot, jsxConfig, setupConfig, ref, $index);
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

export function getAttributes() {
    const component = getCurrentComponent();
    if (!component) throw new Error('`getAttributes` can only be called from within component setup')
    const attributes = component.attributes;
    component.attributes = null;
    return attributes!
}

function runComponentSetup(
    Component: ComponentSetup,
    component: InternalComponent,
    slot: SlotRenderer | undefined,
    jsxConfig: JSXConfig<InternalComponent>,
    setupConfig: ComponentConfig & NodeSetupConfig,
    ref: NodeRef<Component> | undefined,
    $index: Signal<number> | undefined
) {
    collectEffects((flask, outerFlask) => {
        const { class: classString, style: styleString, ...other } = jsxConfig;
        const { class: _class, style, on, props, assigned, ...attributes } = setupConfig;
        const assignedClasses = assigned?.classes || []
        const assignedStyles = assigned?.styles || []
        const assignedEvents = assigned?.events || {}
        const assignedAttributes = assigned?.other || {}

        const { jsxAttributes, jsxEvents } = analyzeAttributes(other)

        if (__DEV__) warnOverlappingKeys(jsxAttributes, props); // pass in all attributes as props ... it's too hard to distinguish props from attributes
        if (__DEV__) warnOverlappingKeys(jsxAttributes, attributes, assignedAttributes);

        component.attributes = {
            events: composeEvents([jsxEvents, on || {}, assignedEvents]),
            classes: [classString, ...normalizeToArray(_class), ...assignedClasses],
            styles: [styleString, ...normalizeToArray(style), ...assignedStyles],
            other: { ...attributes, ...jsxAttributes, ...assignedAttributes }
        }; // must set BEFORE component setup is called

        const nodeEntities = normalizeToArray(Component({ ...props, ...jsxAttributes, slot }));

        component.nodeEntities = nodeEntities;

        if (ref) {
            const _ref = new _NodeRef(ref);
            const publicComponent = component.component || {};
            _ref.assignValue(publicComponent, $index)
            // setUpRefUpdates(_ref, publicComponent, $index, component.preserve)
            initializeRef(component, _ref)
        }

        if (component.attributes) { // if `getAttributes` is called, this will be null
            // fallthrough attributes onto root or first node
            assignAttributes(nodeEntities[0], component.attributes);
            component.attributes = null;
        }

        outerFlask?.onDisposal(flask.dispose) // no outer flask means it's the root component

        // set up hook cascade
        const parent = component.parent;
        if (parent instanceof InternalComponent) {
            onBeforeUnmount(() => component.emit(LifecycleHook.BEFORE_UNMOUNT), parent) //TODO: how do these get cleaned up?
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
    return target as { [key: string]: (EventListener | DerivedSignal<EventListener>)[] };
}

function assignAttributes(nodeEntity: NodeEntity, attributes: AssignedAttributes) {
    if (nodeEntity instanceof HTMLElement) { // from Web API
        applyAttributes(nodeEntity, attributes);
    }
    else if (nodeEntity instanceof InternalComponent) {
        assignAttributes(nodeEntity.nodeEntities[0], attributes)
    }
    else if (__DEV__) {
        console.warn('assigned attributes cannot be automatically applied. Please assign manually.')
    }
}



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

export function analyzeAttributes(jsxEntries: AnyObject) {
    const jsxEvents: AnyObject = {};
    // const jsxProps: AnyObject = {};
    const jsxAttributes: AnyObject = {};
    for (const key in jsxEntries) {
        if (isHTMLEvent(key)) {
            jsxEvents[key.slice(2)] = jsxEntries[key];
        }
        // else if (isHTMLAttribute(key, tag)) {
        // }
        else {
            jsxAttributes[key] = jsxEntries[key];
            // jsxProps[key] = jsxEntries[key];
        }
    }
    return {
        jsxAttributes,
        jsxEvents,
        // jsxProps
    }
}



// function setUpRefUpdates(ref: _NodeRef, component: Component, $index: Signal<number> | undefined, preserve: boolean) {
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
//     //     onBeforeUnmount(() => {
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

//     onBeforeUnmount(() => {
//         ref.setValue(null);
//     })
//     // }
//     ref.markInitialized();
// }


// export function mountComponent(parent: HTMLElement, component: InternalComponent) {
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


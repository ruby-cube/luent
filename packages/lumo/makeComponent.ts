import { AnyObject } from "@rue/types";
import { Component, ComponentSetup, getCurrentComponent, InternalComponent, setCurrentComponent } from "./component";
import { SetKey, Signal } from "../muonic/useSignalize";
import { LifecycleHook, onActivated, onBeforeUnmount, onDeactivated, onUnmounted } from "./lifecycle";
import { collectEffects } from "@rue/flask/flask";
import { _NodeRef, assignNodeRef, castOnCreatedHook, NodeRef } from "./NodeRef";
import { NodeEntity, normalizeRenderOutput } from "./mE";
import { getPreserveValue } from "./ifCase";

// on: T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;
export type ComponentConfig<T extends ComponentSetup<AnyObject> = ComponentSetup> = {
    props?: T extends (props: infer P) => any ? { [K in keyof P]: P[K] } : never;
    on?: { [key: string]: (e: Event, index?: number) => void } //TODO: limit these to web events
    class?: string | { [key: string]: () => boolean };
    style?: any;
    //TODO: add dynamic classes and styles
    $index?: Signal<number>
}

export type SlotRenderer<T extends ComponentSetup = ComponentSetup> =
    T extends (props: infer P) => any ?
    P extends { slot: infer R } ? R : never
    : never

export type RenderSlot = (props: any) => NodeEntity[]

// export class TextRenderer {
//     constructor(public props: {
//         $data: ReactiveSignal<string>
//         text: string
//     }){}
// }
export type ComponentOptions = { preserve?: true }

export function makeComponent<T extends ComponentSetup>(
    Component: T,
    config: ComponentConfig<T> = {},
    slots: NodeEntity[] | RenderSlot[] | SlotRenderer = [], //TODO:
    ref: _NodeRef<InternalComponent> | undefined = undefined,
    options: ComponentOptions | undefined = undefined //TODO:
) {
    const parent = getCurrentComponent();
    if (!parent) throw new Error("No parent component")

    const preserve = options && options.preserve || parent !== 'root' && parent.preserve || getPreserveValue() || false;

    const component = new InternalComponent(parent, preserve);
    console.log("preserve", component.preserve)
    setCurrentComponent(component)
    runComponentSetup(Component, config, component, ref);
    setCurrentComponent(parent) // for sibling components to access parent, must be set AFTER `render()`
    return component;
}



function runComponentSetup<T extends ComponentSetup>(Component: T, config: ComponentConfig<T> = {}, component: InternalComponent, ref: _NodeRef<InternalComponent> | undefined) {
    collectEffects((flask) => {
        const { props, on, class: _class, style, $index, ...other } = config;
        const _component = Component(props)
        if (!_component) throw new Error("Component setup must return component blueprint")
        const { render, provides, exposes } = _component;
        const nodeEntities = normalizeRenderOutput(render());

        component.initialNodeEntities = nodeEntities;
        component.provides = provides;
        component.component = { ...exposes };

        if (ref) {
            const publicComponent = component.component
            assignNodeRef(ref, publicComponent, $index)
            setUpRefUpdates(ref, publicComponent, $index, component.preserve)
            castOnCreatedHook(ref, component, $index)
        }

        //TODO: Slots (make sure parent is correct)
        //TODO: assigned classes, events, style, HTML attributes (on first root, unless has been assigned to another element or component)

        // if (props && '$index' in props) {
        //     const $index = props.$index;
        //     if (on) {
        //         const domNode = getMainDOMNode() //TODO:
        //         for (const event in on) {
        //             const handler = on[event]
        //             const _handler = $index ? (e: Event) => handler(e, $index()) : handler
        //             domNode.addEventListener(event, _handler) //TODO: attach fall-through events on root or designated root domNode if more than one root
        //             onUnmounted(() => domNode.removeEventListener(event, _handler))

        //             //TODO: reattach listeners if domNode changes!
        //         }
        //     }
        // }


        // set up hook cascade
        const parent = component.parent;
        if (parent instanceof InternalComponent) {
            onBeforeUnmount(() => component.emit(LifecycleHook.BEFORE_UNMOUNT), parent)
            onUnmounted(() => component.emit(LifecycleHook.UNMOUNTED), parent)
            onDeactivated(() => component.emit(LifecycleHook.DEACTIVATED), undefined, parent)
            onActivated(() => component.emit(LifecycleHook.ACTIVATED), undefined, parent)
        }
        onUnmounted(() => flask.dispose())
    })
}


function setUpRefUpdates(ref: _NodeRef, component: Component, $index: Signal<number> | undefined, preserve: boolean) {
    if (ref.initialized === true) return;
    if ($index) { // only initiate once per list
        const components = ref.components;
        if (preserve) {
            onDeactivated(() => {
                ref.components = null;
            })
            onActivated(() => {
                ref.components = components
            })
        }
        onBeforeUnmount(() => {
            ref.components = null;
        })
    }
    else {
        if (preserve) {
            onDeactivated(() => {
                ref.component = null;
            })
            onActivated(() => {
                ref.component = component
            })
        }
        onBeforeUnmount(() => {
            ref.component = null;
        })
    }
    ref.initialized = true;
}


// export function mountComponent(parent: HTMLElement, component: InternalComponent) {
//     component.emit(LifecycleHook.BEFORE_MOUNT);
//     parent.append(...component.domNodes);
//     component.emit(LifecycleHook.MOUNTED);
// }

export function unmountComponent(component: InternalComponent) {
    component.emit(LifecycleHook.BEFORE_UNMOUNT);
    // const nodes = component.initialNodeEntities;
    // for (const node of nodes) {
    //     node.remove();
    // }
    component.emit(LifecycleHook.UNMOUNTED);
}


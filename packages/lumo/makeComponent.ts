import { AnyObject } from "@rue/types";
import { ComponentSetup, getCurrentComponent, InternalComponent, setCurrentComponent } from "./component";
import { SetKey, Signal } from "../muonic/useSignalize";
import { LifecycleHook, onUnmounted } from "./lifecycle";
import { collectEffects } from "@rue/flask/flask";
import { _NodeRef, castOnCreatedHook, NodeRef } from "./NodeRef";
import { NodeEntity, normalizeRenderOutput } from "./mE";

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

    const component = new InternalComponent(parent);
    setCurrentComponent(component)
    runComponentSetup(Component, config, component, ref);
    setCurrentComponent(parent) // for sibling components to access parent, must be set AFTER `render()`
    return component;
}


function runComponentSetup<T extends ComponentSetup>(Component: T, config: ComponentConfig<T> = {}, component: InternalComponent, ref: _NodeRef<InternalComponent> | undefined) {
    collectEffects((flask, outerFlask) => {
        const { props, on, class: _class, style, $index, ...other } = config;
        const _component = Component(props)
        if (!_component) throw new Error("Component setup must return component blueprint")
        const { render, provides, exposes } = _component;
        const nodeEntities = normalizeRenderOutput(render());

        component.initialNodeEntities = nodeEntities;
        component.provides = provides;
        component.component = { ...exposes };

        //TODO: Slots (make sure parent is correct)
        //TODO: HTML attributes, including data
        if (ref) {
            assignNodeRef(ref, component.component, $index)
            castOnCreatedHook(ref, component, $index)
        }

        if (props && '$index' in props) {
            const $index = props.$index;
            if (on) {
                const domNode = getMainDOMNode() //TODO:
                for (const event in on) {
                    const handler = on[event]
                    const _handler = $index ? (e: Event) => handler(e, $index()) : handler
                    domNode.addEventListener(event, _handler) //TODO: attach fall-through events on root or designated root domNode if more than one root
                    onUnmounted(() => domNode.removeEventListener(event, _handler))

                    //TODO: reattach listeners if domNode changes!
                }
            }
        }


        onUnmounted(() => flask.dispose())
        outerFlask.onDisposed(() => unmountComponent(component))
    })
}

function assignNodeRef(ref: _NodeRef<InternalComponent>, component: AnyObject, $index: Signal<number> | undefined) {
    if ($index != null) {
        let nodes = ref.components ? ref.components! : []
        nodes[$index()] = component;
    }
    else {
        ref.component = component
    }
}
// export function mountComponent(parent: HTMLElement, component: InternalComponent) {
//     component.emit(LifecycleHook.PREMOUNT);
//     parent.append(...component.domNodes);
//     component.emit(LifecycleHook.MOUNTED);
// }

export function unmountComponent(component: InternalComponent) {
    component.emit(LifecycleHook.PREUNMOUNT);
    // const nodes = component.initialNodeEntities;
    // for (const node of nodes) {
    //     node.remove();
    // }
    component.emit(LifecycleHook.UNMOUNTED);
}


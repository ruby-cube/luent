import { AnyObject } from "@rue/types";
import { ComponentSetup, getCurrentComponent, InternalComponent, setCurrentComponent } from "./component";
import { SetKey, Signal } from "../muonic/useSignalize";
import { LifecycleHook, onUnmounted } from "./lifecycle";
import { collectEffects } from "../flask/flask";
import { _NodeRef, castOnCreatedHook, NodeRef } from "./NodeRef";
import { normalizeRenderOutput } from "./mX";

type ComponentConfig<T extends ComponentSetup<AnyObject> | string> = {
    props?: T extends (props: infer P, emit: any) => any ? { [K in keyof P]: P[K] } : never;

    on?: T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;
    class?: string | { [key: string]: () => boolean };
    style?: any;
    text?: string | (() => void)
    ref?: NodeRef
    $index?: Signal<number>
}

// export class TextRenderer {
//     constructor(public props: {
//         $data: ReactiveSignal<string>
//         text: string
//     }){}
// }

export function _mXO<T extends ComponentSetup>(Component: T, config: ComponentConfig<T> = {}) {
    const parent = getCurrentComponent();
    if (!parent) throw new Error("No parent component")

    const component = new InternalComponent(parent);
    setCurrentComponent(component)
    setUpComponent(Component, config, component);
    setCurrentComponent(parent) // for sibling components to access parent, must be set AFTER `render()`
    return component;
}


function setUpComponent<T extends ComponentSetup>(Component: T, config: ComponentConfig<T> = {}, component: InternalComponent) {
    collectEffects((flask, outerFlask) => {
        const { props, on, class: _class, ref, style, text, $index, ...other } = config;
        const _component = Component(props)
        if (!_component) throw new Error("Component setup must return component blueprint")
        const { render, provides, exposes } = _component;
        const nodeEntities = normalizeRenderOutput(render());

        component.initialNodeEntities = nodeEntities;
        component.provides = provides;
        component.component = { ...exposes };
        if (ref) {
            (<_NodeRef>ref).component = component.component
        }

        //TODO: Slots (make sure parent is correct)
        //TODO: HTML attributes, including data
        if (ref) {
            assignNodeRef(ref, component.component, $index)
            castOnCreatedHook(ref, component, $index)
        }

        onUnmounted(() => flask.dispose())
        outerFlask.onDisposed(() => unmountComponent(component))
    })
}

function assignNodeRef(ref: _NodeRef, component: AnyObject, $index: Signal<number> | undefined) {
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


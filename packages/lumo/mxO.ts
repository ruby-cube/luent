import { AnyObject } from "@rue/types";
import { ComponentSetup, getCurrentComponent, InternalComponent, setCurrentComponent } from "./component";
import { SetKey, Signal } from "../muonic/useSignalize";
import { LifecycleHook } from "./lifecycle";
import { collectEffects } from "../flask/flask";
import { onUnmounted } from "@rue/paravue";

type ComponentConfig<T extends ComponentSetup<AnyObject> | string> = {
    props?: T extends (props: infer P, emit: any) => any ? { [K in keyof P]: P[K] } : never;

    on?: T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;
    class?: string | { [key: string]: () => boolean };
    style?: any;
    text?: string | (() => void)
    key?: string | number
    ref?: Signal
}

// export class TextRenderer {
//     constructor(public props: {
//         $data: ReactiveSignal<string>
//         text: string
//     }){}
// }

export function mxO<T extends ComponentSetup>(Component: T, config: ComponentConfig<T> = {}) {
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
        const { props, on, class: _class, key, ref, style, text, ...other } = config;
        const _component = Component(props)
        if (!_component) throw new Error("Component setup must return component blueprint")
        const { render, provides, exposes, scoped, global } = _component;
        const nodeEntities = render();

        component.initialNodeEntities = nodeEntities;
        component.provides = provides;
        component.component = { ...exposes };
        if (ref) {
            //@ts-expect-error
            ref[SetKey](() => component.component)
        }


        //TODO: Slots (make sure parent is correct)
        //TODO: HTML attributes, including data

        onUnmounted(flask.dispose)
        outerFlask.onDisposed(() => unmountComponent(component))
    })
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


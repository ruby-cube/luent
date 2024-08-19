import { PublicComponent, ComponentSetup, InternalComponent } from "./component/InternalComponent";
import { NodeEntity, RenderFunction } from "./node/makeNode";
import { makeComponent, mO, runComponentSetup } from "./component/makeComponent";
import { _NodePod } from "./node/NodePod";
import { collectEffects, EffectFlask } from "@rue/flask";
import { LifecycleHook } from "./component/lifecycle";
import { popComponent, pushComponent } from "./component/componentStack";

let appRoot: Element;

export function getAppRoot() {
    return appRoot;
}

// The mount function simulates this:
//
// function RootComponent(){
//     return (
//         <div id="app">
//             < App />
//         </div>
//     )
// }

export function createApp(App: ComponentSetup) {
    return {
        // App,
        // flask: undefined as Flask | undefined,
        component: undefined as InternalComponent | undefined,
        mount(id: string) {
            const root = document.querySelector(id);
            if (!(root instanceof Element)) throw new Error('No root element to mount app to. Check selector string')
            appRoot = root;

            // (1) create a mock RootComponent to serve as the parent to developer's root component
            const parentComponent = new InternalComponent(null, false);
            pushComponent(parentComponent)
            // (2) instantiate developer's root component
            const component = makeComponent(App, undefined, {}, undefined)

            // (3) attach developer's root component to root element
            component.mount(parentComponent, root, new _NodePod())
            component.emit(LifecycleHook.SETUP_COMPLETED)
            popComponent()

            return component;
        },
        unmount() {
            this.component?.unmount();
        }

    }
}







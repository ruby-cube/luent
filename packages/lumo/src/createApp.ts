import { PublicComponent, ComponentSetup, InternalComponent } from "./component/InternalComponent";
import { NodeEntity, RenderFunction } from "./node/makeNode";
import { makeComponent, mO, runComponentSetup } from "./component/makeComponent";
import { _NodePod } from "./node/NodePod";
import { collectEffects, EffectFlask } from "@rue/flask";
import { LifecycleHook } from "./component/lifecycle";
import { LifecycleHook as DynamicLifecycleHook } from "./dynamic/lifecycle";
import { popComponent, pushComponent } from "./component/componentStack";
import { DynamicNode, popDynamicNode, pushDynamicNode } from "./dynamic/DynamicNode";

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

export function createApp(App: ComponentSetup, config?: { remountable: boolean }) {
    // (1) create a mock RootComponent to serve as the parent to developer's root component
    const parentComponent = new InternalComponent(null); //QUESTION: Do I really need this?
    
    // (2) instantiate developer's root component
    const component = new InternalComponent(null);
    const nodePod = new _NodePod()
    const remountable = config?.remountable
    const preserve = remountable ? true : false
    const dynamicNode = new DynamicNode(null, preserve, nodePod);

    return {
        component,
        dynamicNode,

        mount(id: string) {
            const root = document.querySelector(id);
            if (!(root instanceof Element)) throw new Error('No root element to mount app to. Check selector string')
            appRoot = root;

            pushComponent(component)
            // (3) attach developer's root component to root element
            dynamicNode.activate(function mountRootComponent() {
                runComponentSetup(App, component, undefined, {}, undefined); // preserve node entities for remount
                component.emit(LifecycleHook.AFTER_CREATE)
                component.mount(parentComponent, root, nodePod) //TODO: if this is a remount, how would it be different than a first mount
            })
            popComponent() // for sibling components to access parent, must be set AFTER `Component()`

            return component;
        },

        unmount() { //TODO: should I call dynamicNode.unmount() instead of emit?? same for destroy?
            if (!remountable) {
                if (__DEV__) throw new Error('App cannot be unmounted. Did you mean to call `destroy`? To enable unmount and remount, set `remountable` to true in config.')
                return;
            }
            this.dynamicNode!.emit(DynamicLifecycleHook.ON_DEACTIVATE);
            const nodePod = this.dynamicNode!.nodePod;
            nodePod?.forEachNode((node) => node.remove()) //TODO: Preserve
        },

        destroy() {
            this.unmount()
            this.dynamicNode!.emit(DynamicLifecycleHook.ON_DESTROY);
        }
    }
}







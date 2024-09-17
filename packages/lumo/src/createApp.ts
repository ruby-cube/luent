import { ComponentSetup, InternalComponent } from "./component/InternalComponent";
import { _NodePod } from "./node/NodePod";
import { DynamicNode, markMountPhase, unmarkMountPhase } from "./dynamic/DynamicNode";
import { popProvider, pushProvider } from "./component/provide";
import { runProviderComponentSetup } from "./component/makeComponent";
import { ProviderComponent } from "./component/ProviderComponent";

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

    // (1) instantiate developer's root component
    const component = new ProviderComponent(null);
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

            // (2) attach developer's root component to root element
            dynamicNode.activate(function mountRootComponent() {
                pushProvider(component)
                runProviderComponentSetup(App, component, undefined, {}, undefined); //TODO: preserve node entities for remount
                if (remountable) markMountPhase()
                component.mount(root, nodePod) //TODO: if this is a remount, how would it be different than a first mount? use fragment?
                if (remountable) unmarkMountPhase()
                popProvider() // for sibling components to access parent, must be set AFTER `Component()`
            })

            return component;
        },

        unmount() { //TODO: should I call dynamicNode.unmount() instead of emit?? same for destroy?
            if (!remountable) {
                if (__DEV__) throw new Error('App cannot be unmounted. Did you mean to call `destroy`? To enable unmount and remount, set `remountable` to true in config.')
                return;
            }
            this.dynamicNode.unmount()
        },

        destroy() {
            this.unmount()
            this.dynamicNode.destroy()
        }
    }
}






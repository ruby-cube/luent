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

export function createApp(App: ComponentSetup) {
    return {
        // App,
        // flask: undefined as Flask | undefined,
        component: undefined as InternalComponent | undefined,
        dynamicNode: undefined as DynamicNode | undefined,
        mount(id: string) {
            const root = document.querySelector(id);
            if (!(root instanceof Element)) throw new Error('No root element to mount app to. Check selector string')
            appRoot = root;

            // (1) create a mock RootComponent to serve as the parent to developer's root component
            const parentComponent = new InternalComponent(null); //QUESTION: Do I really need this?
            pushComponent(parentComponent)

            // (2) instantiate developer's root component
            const { component, dynamicNode } = makeRootComponent(App)
            component.emit(LifecycleHook.SETUP_COMPLETED)
            this.component = component;
            this.dynamicNode = dynamicNode;

            // (3) attach developer's root component to root element
            component.mount(parentComponent, root, new _NodePod())
            dynamicNode.emit(DynamicLifecycleHook.MOUNTED)
            popComponent()

            return component;
        },
        unmount() {
            this.dynamicNode!.emit(DynamicLifecycleHook.BEFORE_UNMOUNT); //TODO: add mount and unmount hooks to root component
            const nodePod = this.dynamicNode!.nodePod;
            nodePod?.forEachNode((node) => node.remove())
        }

    }
}



export function makeRootComponent(
    Component: ComponentSetup,
): { component: InternalComponent, dynamicNode: DynamicNode } {
    const component = new InternalComponent(null);
    pushComponent(component)

    const dynamicNode = new DynamicNode(null);
    pushDynamicNode(dynamicNode);
    collectEffects((flask) => {
        dynamicNode.setFlask(flask)

        runComponentSetup(Component, component, undefined, {}, undefined);

    }, 'RootComponent')
    popDynamicNode();

    component.emit(LifecycleHook.SETUP_COMPLETED)
    popComponent() // for sibling components to access parent, must be set AFTER `Component()`
    return { component, dynamicNode };
}






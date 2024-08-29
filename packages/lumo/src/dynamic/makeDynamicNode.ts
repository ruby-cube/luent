import { collectEffects, EffectFlask } from "@rue/flask";
import { DynamicNode, getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "./DynamicNode";
import { _NodePod } from "../node/NodePod";
import { onDestroy, beforeUnmount, LifecycleHook, onActivated, onDeactivate } from "./lifecycle";


// export function activateDynamicNode(
//     Component: ComponentSetup,
//     Slot: InferSlot | undefined,
//     config: ComponentConfig,
//     $index: Signal<number> | undefined
// ): InternalComponent {
//     const parent = getCurrentComponent<InternalComponent>();
//     const component = new InternalComponent(parent);
//     pushComponent(component)
//     runComponentSetup(Component, component, Slot, config, $index);
//     component.emit(LifecycleHook.AFTER_CREATE)
//     popComponent() // for sibling components to access parent, must be set AFTER `Component()`
//     return component;
// }

export function makeDynamicNode(preserve: boolean, nodePod?: _NodePod) {
    const parent = getActiveDynamicNode();
    const dynamicNode = new DynamicNode(parent, preserve, nodePod);
    // set up hook cascade //QUESTION: Is this the right place to set up hook cascade?
    if (parent instanceof DynamicNode) {
        onActivated(() => { dynamicNode.emit(LifecycleHook.ON_ACTIVATED) }, {
            until: (cleanup) => onDestroy(cleanup, parent),
            flask: 'outlive'
        }, parent)
        onDeactivate(() => { dynamicNode.deactivate() }, {
            until: (cleanup) => onDestroy(cleanup, parent),
            flask: 'outlive'
        }, parent)
        onDestroy(() => { dynamicNode.destroy() }, parent)
    }
    return dynamicNode;
}




// export function setupDynamicNodeLifecycleHooks(node: DynamicNode) {
//     // set up hook cascade
//     const parent = node.parent;
//     if (parent instanceof DynamicNode) {
//         beforeUnmount(() => node.unmount(), undefined, parent) //TODO: how do these get cleaned up?
//         onDestroy(() => node.destroy(), parent)
//     }
// }

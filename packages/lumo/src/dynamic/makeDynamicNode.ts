import { collectEffects, EffectFlask } from "@rue/flask";
import { DynamicNode, getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "./DynamicNode";
import { _NodePod } from "../node/NodePod";
import { beforeDestroy, beforeUnmount, LifecycleHook } from "./lifecycle";


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
//     component.emit(LifecycleHook.CREATED)
//     popComponent() // for sibling components to access parent, must be set AFTER `Component()`
//     return component;
// }

export function makeDynamicNode(nodePod?: _NodePod) {
    const parent = getActiveDynamicNode();
    return new DynamicNode(parent, nodePod);
}




// export function setupDynamicNodeLifecycleHooks(node: DynamicNode) {
//     // set up hook cascade
//     const parent = node.parent;
//     if (parent instanceof DynamicNode) {
//         beforeUnmount(() => node.unmount(), undefined, parent) //TODO: how do these get cleaned up?
//         beforeDestroy(() => node.destroy(), parent)
//     }
// }

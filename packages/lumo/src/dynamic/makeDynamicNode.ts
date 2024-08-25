import { collectEffects, EffectFlask } from "@rue/flask";
import { DynamicNode, getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "./DynamicNode";
import { beforeDeactivate, beforeUnmount, LifecycleHook, onActivated } from "./lifecycle";
import { _NodePod } from "../node/NodePod";


// export function makeDynamicNode(
//     Component: ComponentSetup,
//     Slot: InferSlotted | undefined,
//     config: ComponentConfig,
//     $index: Signal<number> | undefined
// ): InternalComponent {
//     const parent = getCurrentComponent<InternalComponent>();
//     const component = new InternalComponent(parent);
//     pushComponent(component)
//     runComponentSetup(Component, component, Slot, config, $index);
//     component.emit(LifecycleHook.SETUP_COMPLETED)
//     popComponent() // for sibling components to access parent, must be set AFTER `Component()`
//     return component;
// }



export function makeDynamicNode(render: () => void, nodePod?: _NodePod) {
    const parent = getActiveDynamicNode();
    const dynamicNode = new DynamicNode(parent, nodePod);
    pushDynamicNode(dynamicNode);
        collectEffects((flask, outerFlask) => {
            dynamicNode.setFlask(flask)

            render()

            outerFlask?.onDisposal(flask.dispose)
            setupDynamicNodeLifecycleHooks(dynamicNode)
        }, render.name)
    popDynamicNode();
    return dynamicNode;
}


export function setupDynamicNodeLifecycleHooks(node: DynamicNode) {
    // set up hook cascade
    const parent = node.parent;
    if (parent instanceof DynamicNode) {
        beforeUnmount(() => node.emit(LifecycleHook.BEFORE_UNMOUNT), parent) //TODO: how do these get cleaned up?
        beforeDeactivate(() => node.emit(LifecycleHook.BEFORE_DEACTIVATE), undefined, parent)
        onActivated(() => node.emit(LifecycleHook.ACTIVATED), undefined, parent)
    }
}

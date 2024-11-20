import { DynamicNode, LifecycleHook} from "./DynamicNode";
import { _NodePod } from "../node/NodePod";
import { getActiveDynamicNode } from "./nodestack";


// export function activateDynamicNode(
//     Component: ComponentSetup,
//     Slot: InferSlot | undefined,
//     config: ComponentConfig,
//     $index: AtomicIon<number> | undefined
// ): InternalComponent {
//     const parent = getCurrentComponent<InternalComponent>();
//     const component = new InternalComponent(parent);
//     pushProvider(component)
//     runComponentSetup(Component, component, Slot, config, $index);
//     component.emit(LifecycleHook.ON_CREATED)
//     popProvider() // for sibling components to access parent, must be set AFTER `Component()`
//     return component;
// }

export function makeDynamicNode(nodePod: _NodePod) {
    const parent = getActiveDynamicNode();
    const dynamicNode = new DynamicNode(parent, nodePod);
    if (parent instanceof DynamicNode) {
        parent.onReactivate(() => { dynamicNode.emit(LifecycleHook.ON_REACTIVATE) }, { //FIX: This makes on activated run twice when it is first activated (see if this has been fixed)
            until: dynamicNode.onDestroy,
        })
        parent.onDeactivate(() => { dynamicNode.emit(LifecycleHook.ON_DEACTIVATE) }, {
            until: dynamicNode.onDestroy,
        })
        parent.onDestroy(() => { dynamicNode.destroy() }, {
            cancel: dynamicNode.onDestroy,
            __devName: 'makeDynamicNode, onDestroy'
        })
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

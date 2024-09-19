import { DynamicNode} from "./DynamicNode";
import { _NodePod } from "../node/NodePod";
import { onDestroy, LifecycleHook, onActivated, onDeactivate } from "./lifecycle";
import { getActiveDynamicNode } from "./nodestack";


// export function activateDynamicNode(
//     Component: ComponentSetup,
//     Slot: InferSlot | undefined,
//     config: ComponentConfig,
//     $index: AtomicSignal<number> | undefined
// ): InternalComponent {
//     const parent = getCurrentComponent<InternalComponent>();
//     const component = new InternalComponent(parent);
//     pushProvider(component)
//     runComponentSetup(Component, component, Slot, config, $index);
//     component.emit(LifecycleHook.ON_CREATED)
//     popProvider() // for sibling components to access parent, must be set AFTER `Component()`
//     return component;
// }

export function makeDynamicNode(preserve: boolean, nodePod?: _NodePod) {
    const parent = getActiveDynamicNode();
    const dynamicNode = new DynamicNode(parent, preserve, nodePod);
    if (parent instanceof DynamicNode) {
        onActivated(() => { dynamicNode.emit(LifecycleHook.ON_ACTIVATED) }, { //FIX: This makes on activated run twice when it is first activated
            until: onDestroyDynamicNode,
        })
        onDeactivate(() => { dynamicNode.deactivate() }, {
            until: onDestroyDynamicNode,
        })
        onDestroy(() => { dynamicNode.destroy() }, {
            cancel: onDestroyDynamicNode,
            __devName: 'makeDynamicNode, onDestroy'
        })
    }

    function onDestroyDynamicNode(cleanUp: ()=>void){
        return onDestroy(cleanUp, {}, dynamicNode)
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

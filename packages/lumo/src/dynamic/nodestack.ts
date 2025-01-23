import { getActiveFlask } from "@rue/flask";
import type { DynamicNode } from "./DynamicNode";

// let activeDynamicNode: DynamicNode | null = null
// let parent: DynamicNode | null = null;

// export function _getActiveDynamicNode() {
//    return activeDynamicNode
// }

// export function _getDynamicNode() {
//    if (!activeDynamicNode) throw new Error('Cannot call _getDynamicNode outside of component tree')
//    return activeDynamicNode;
// }

// export function pushDynamicNode(dynamicNode: DynamicNode) {
//    parent = activeDynamicNode;
//    activeDynamicNode = dynamicNode;
//    if (dynamicNode.flask) pushFlask(dynamicNode.flask)
// }

// export function popDynamicNode() {
//    if (activeDynamicNode?.flask === getActiveFlask()) popFlask()
//    activeDynamicNode = parent;
//    parent = parent?.parent || null;
// }
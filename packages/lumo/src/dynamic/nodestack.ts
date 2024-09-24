import type { DynamicNode } from "./DynamicNode";

let activeDynamicNode: DynamicNode | null = null
let parent: DynamicNode | null = null;

export function getActiveDynamicNode() {
    if (!activeDynamicNode) throw new Error('Cannot call getActiveDynamicNode outside of component tree')
    return activeDynamicNode;
}

export function pushDynamicNode(dynamicNode: DynamicNode) {
    parent = activeDynamicNode;
    activeDynamicNode = dynamicNode;
    dynamicNode.flask?.reactivate()
}

export function popDynamicNode() {
    activeDynamicNode?.flask?.deactivate();
    activeDynamicNode = parent;
    parent = parent?.parent || null;
}
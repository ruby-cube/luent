import { getFlask, popFlask, pushFlask } from "@rue/flask";
import type { DynamicNode } from "./DynamicNode";

let activeDynamicNode: DynamicNode | null = null
let parent: DynamicNode | null = null;

export function getDynamicNode() {
   return activeDynamicNode
}

export function getActiveDynamicNode() {
   if (!activeDynamicNode) throw new Error('Cannot call getActiveDynamicNode outside of component tree')
   return activeDynamicNode;
}

export function pushDynamicNode(dynamicNode: DynamicNode) {
   parent = activeDynamicNode;
   activeDynamicNode = dynamicNode;
   if (dynamicNode.flask) pushFlask(dynamicNode.flask)
}

export function popDynamicNode() {
   if (activeDynamicNode?.flask === getFlask()) popFlask()
   activeDynamicNode = parent;
   parent = parent?.parent || null;
}
import { DOMNode } from "../component/InternalComponent";
import { NodePod } from "../node/NodePod";

export function mountElement(parent: Element, node: DOMNode, fragment?: DocumentFragment) {
    // console.log('mount element', fragment, parent, node)
    const root = fragment ? fragment : parent;
    root.appendChild(node)
}

export function setUpElement(node: DOMNode, nodePod: NodePod) {
    nodePod.push(node)
    return node;
}


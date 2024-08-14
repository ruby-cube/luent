import { DOMNode } from "../component/InternalComponent";
import { _NodePod } from "../node/NodePod";

export function mountElement(parent: Element, node: DOMNode, nodePod: _NodePod, fragment?: DocumentFragment) {
    nodePod.appendStaticNode(node)
    const root = fragment ? fragment : parent;
    root.appendChild(node)
}
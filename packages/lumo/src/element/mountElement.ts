import { DOMNode } from "../component/InternalComponent";
import { NodeVine } from "../dynamic/NodeVine";

export function mountElement(parent: Element, node: DOMNode, fragment?: DocumentFragment) {
    // console.log('mount element', fragment, parent, node)
    const root = fragment ? fragment : parent;
    root.appendChild(node)
}

export function setUpElement(node: DOMNode, nodeVine: NodeVine) {
    nodeVine.push(node)
    return node;
}


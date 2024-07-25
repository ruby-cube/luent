import { DOMNode } from "./component"
import { _NodePod } from "./NodePod"

const showIfMap: WeakMap<DOMNode, string> = new WeakMap()

export function hideDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        if (node instanceof HTMLElement) {
            showIfMap.set(node, node.style.display)
            node.style.display = 'none'
        }
        else { // TextNode
            showIfMap.set(node, node.data)
            node.data = ""
        }
    })
}

function showDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        if (node instanceof HTMLElement) {
            const display = showIfMap.get(node)
            if (display === undefined) throw new Error("previous display info missing")
            node.style.display = display
        }
        else {
            const text = showIfMap.get(node)
            if (text === undefined) throw new Error("previous text info missing")
            node.data = text;
        }
    })
}
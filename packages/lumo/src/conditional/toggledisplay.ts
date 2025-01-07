import { DOMNode } from "../component/InternalComponent"
import { _DynamicNodePod, _NodePod } from "../node/NodePod"
import { NodeEntity } from "../node/makeNode"
import { mountConditional } from "./ConditionalRenderSeries"


export function hidePrevConditionalNodes(dynamicPod: _DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    console.log('hide nodePod', nodePod, dynamicPod)
    hideDOMNodes(nodePod)
}


export function showConditionalNodes(parent: Element, dynamicPod: _DynamicNodePod, activeIndex: number, nodeEntities: NodeEntity[]) {
    const nodePod = dynamicPod[activeIndex];
    if (nodePod.length === 0) { // lazy render
        mountConditional(parent, dynamicPod, nodeEntities)
    }
    showDOMNodes(nodePod) //QUESTION: Not sure if this should be in an else block... is it necessary to set display on newly rendered nodes?
}



const showIfMap: WeakMap<DOMNode, string> = new WeakMap()

export function hideDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        if (node instanceof HTMLElement) {
            showIfMap.set(node, node.style.display)
            node.style.display = 'none'
        }
        else if (node instanceof CharacterData) { // TextNode
            showIfMap.set(node, node.data)
            node.data = ""
        }
        else if (node instanceof SVGAElement) {

        }
        else if (node instanceof MathMLElement) {

        }
        else if (__DEV__) {
            console.warn(`Unhandled node type ${node}`)
        }
    })
}

function showDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        if (node instanceof HTMLElement) {
            const display = showIfMap.get(node)
            if (display === undefined) {
                node.style.removeProperty('display');
            }
            else {
                node.style.display = display
            }
        }
        else if (node instanceof SVGAElement) {
            //TODO:
        }
        else if (node instanceof MathMLElement) {
            //TODO:
        }
        else if (node instanceof CharacterData) {
            const text = showIfMap.get(node)
            if (text === undefined) throw new Error("previous text info missing")
            node.data = text;
        }
        else {
            console.warn(`Unhandled node type ${node}`)
        }
    })
}


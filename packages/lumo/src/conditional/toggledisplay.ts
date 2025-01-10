import { DOMNode } from "../component/InternalComponent"
import { NodeVine } from "../dynamic/NodeVine";
import { _DynamicNodePod, _NodePod } from "../node/NodePod"
import { NodeKit } from "../node/setUpNodeEntities";
import { mountConditional } from "./ConditionalRenderSeries"




// export function showConditionalNodes(parent: Element, dynamicVine: NodeVine, vine: NodeVine, nodeEntities: NodeKit[]) {

//     showDOMNodes(vine) //QUESTION: Not sure if this should be in an else block... is it necessary to set display on newly rendered nodes?
// }



const showIfMap: WeakMap<DOMNode, string> = new WeakMap()

export function hideDOMNodes(vine: NodeVine) {
   vine.forEach((node) => {
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

export function showDOMNodes(vine: NodeVine) {
   vine.forEach(node => {
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


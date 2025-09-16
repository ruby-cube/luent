import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { isFunction, isObject, normalizeToArray } from "@rue/utils";
import { atMounted, atUnmount, atRemounted } from "../flask/flask-hooks";
import { queueInternalRenderTask } from "../render-cycle";
import { mountDOMNodes, setUpNodeVine, removeDOMNodes, processJSXOutput } from "../node/VineNode";
import { getFlask } from "@rue/flask";

export type MorphConfig = {}

let morphConfig: MorphConfig | undefined

export function getTransition() {
   const _morphConfig = morphConfig;
   morphConfig = undefined; // applies to only one conditional node. Once used, it is made undefined.
   return _morphConfig
}

export type PortalNodeInput = {
   to: string | Element,
}

type SelectorString = string

//TODO: need a portal kit in order for it to show up in node pod?
// export function createPortalNode(Slot: () => JSXNode, input: PortalNodeInput) {
//    const { to: container } = input
//    if (!(isFunction(Slot))) throw new Error('')
//    const element = typeof container === "string" ? document.querySelector(container) : container;
//    if (!element) throw new Error('Portal destination not found. Please check value of "to" attribute.')
//    const nodePod = new NodePod(); //TODO: do I append to outer node pod?? how does this work?
//    nodePod.push(element) // serves as an indicator to append instead of prepend for dynamic updates

//    const _nodeEntities = setUpNodeEntities(normalizeToArray(unnestComponent(Slot())), element, nodePod)
//    mountNodeEntities(_nodeEntities, element)
//    return undefined;
// }


export function Portal(container: SelectorString | Element, render: RenderFunction | RawJSXNode) {
   if (!(isFunction(render))) throw new Error('Compiler failed to turn JSX into render function')

   const element = typeof container === "string" ? document.querySelector(container) : container;
   if (!element) throw new Error('Portal destination not found. Please check value of "to" attribute.')

   const flask = getFlask().outer
   
   const nodes = processJSXOutput(render(), element)

   queueInternalRenderTask(() => {
      mountDOMNodes(nodes, element)
   }, flask)

   atUnmount((final) => {
      console.log('unmount portal!')
      queueInternalRenderTask(() => {
         console.log('unmount portal REMOVE!', nodes)
         removeDOMNodes(nodes)
      }, flask)
   })

   atRemounted(() => {
      mountDOMNodes(nodes, element)
   })
}

// export function isPortal(value: unknown) {
//    return isObject(value) && 'type' in value && value.type === 'portal'
// }


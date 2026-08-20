import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { isFunction, isObject, normalizeToArray } from "@luent/utils";
import { atAttach, beforeDetach, atRemount, atDetach } from "../flask/flask-hooks";
import { mountDOMNodes, setUpNodeVine, removeDOMNodes, processJSXOutput, JSXNode, VineNode } from "../node/VineNode";
import { getFlask } from "@luent/flask";
import { queueInternalRender, queueRender } from "@luent/quarky";
import { AnyObject } from "@luent/types";
import { setUpElement } from "../element/setUpElement";

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

// TODO: need a portal kit in order for it to show up in node pod?
// export function createPortalNode(Slot: () => JSXNode, input: PortalNodeInput) {
//    const { to: container } = input
//    if (!(isFunction(Slot))) throw new Error('')
//    const element = typeof container === "string" ? document.querySelector(container) : container;
//    if (!element) throw new Error('Portal destination not found. Please check value of "to" attribute.')
//    const nodePod = new NodePod(); // TODO: do I append to outer node pod?? how does this work?
//    nodePod.push(element) // serves as an indicator to append instead of prepend for dynamic updates

//    const _nodeEntities = setUpNodeEntities(normalizeToArray(unnestComponent(Slot())), element, nodePod)
//    mountNodeEntities(_nodeEntities, element)
//    return undefined;
// }

let _portalMap: Map<any, any> | undefined;

export function Portal(container: SelectorString | Element, render: RenderFunction | RawJSXNode | undefined, config?: AnyObject) {

  const element = typeof container === "string" ? document.querySelector(container) : container;
  if (!element) throw new Error('Portal destination not found. Please check value of "to" attribute.')
  if (config) {
    // set up attributes
    setUpElement(element, undefined, config)
  }
  if (!render) return;
  if (!(isFunction(render))) throw new Error('Compiler failed to turn JSX into render function')
  const nodes = processJSXOutput(render())

  if (nodes[0] instanceof VineNode) {
    const portalMap = _portalMap ?? (_portalMap = new Map())
    const comment = portalMap.get(element) ?? (portalMap.set(element, document.createComment('portal')), portalMap.get(element))
    nodes.unshift(comment)
  }

  setUpNodeVine(nodes, element)
  const flask = getFlask()

  queueInternalRender(() => {
    mountDOMNodes(nodes, element)
  })

  atDetach((final) => {
    removeDOMNodes(nodes)
  })

  atRemount(() => {
    mountDOMNodes(nodes, element)
  })

  return new PortalKit(nodes);
}

class PortalKit extends VineNode {
  constructor(public nodes: JSXNode[]) {
    super()
  }
}

// export function isPortal(value: unknown) {
//    return isObject(value) && 'type' in value && value.type === 'portal'
// }


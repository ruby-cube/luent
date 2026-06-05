import { isFunction, normalizeToArray } from "@rue/utils";
import { toSetup } from "../component/bindings";
import { ComponentTag } from "../component/Component";
import { RenderSlot } from "../component/x-Input";
import { ComponentConfig, ElementConfig, RawJSXNode } from "../node/makeJSXNode";
import { $from } from "../utils/destructure";
import { toString } from '../node/VineNode'
import { isComponentKit } from "@rue/nextscript";

function renderElement(
  tagName: string,
  Slot: RenderSlot | undefined,
  bindings: ElementConfig,
) {
  return `<${tagName}${renderBindings(bindings)}>${renderSlot(Slot)}</${tagName}>`
}

function renderBindings(bindings: ElementConfig) {
  const attributes = analyzeBindings(bindings)
  let renderedAttributes = ''
  for (const attribute of attributes) {
    if (attribute.type === 'boolean' && attribute.value) {
      renderedAttributes += ` ${attribute.name}`
    }
    else {
      renderedAttributes += ` ${attribute.name}="${attribute.value}"`
    }
  }
  return renderedAttributes
}

function analyzeBindings(bindings: ElementConfig) { // TODO: 
  const attributes: {
    name: string,
    value: string | boolean,
    type: 'boolean' | 'string'
  }[] = []

  return attributes
}

function renderSlot(Slot: RenderSlot | undefined,) {
  if (!Slot) return ''
  return processJSXOutput(Slot())
}


export function processJSXOutput(rawJSX: RawJSXNode) {
  return _processJSXOutput(normalizeToArray(rawJSX))
}

/**
 * - spread arrays and components into root array
 * - get rid of undefined
 * @param jsxNodes 
 */
function _processJSXOutput(jsxNodes: RawJSXNode[], flattened: string[] = []) {
  for (const node of jsxNodes) {

    if (Array.isArray(node)) {
      _processJSXOutput(node, flattened)
    }
    else if (isComponentKit(node)) {
      _processJSXOutput(node.nodes as RawJSXNode[], flattened)
    }
    else if (isFunction(node)) {
      if (node.length !== 0) throw new Error('render functions must have no parameters')
      flattened.push(toString(node()))
    }
    else if (node == null || node === '') {
      continue;
    }
    // else if (node instanceof VineNode) { // TODO: SSR versions of createIfSeries etc
    //   flattened.push(node)
    // }
    else {
      flattened.push(toString(node))
    }
  }
  return flattened;
}

function renderComponent(
  Component: ComponentTag,
  fromTag: ComponentConfig,
) {
  const setup = toSetup(fromTag) // TODO: SSR version of toSetup?
  return processJSXOutput(Component($from(setup)))
}
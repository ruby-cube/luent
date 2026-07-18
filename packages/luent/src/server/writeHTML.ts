import { camelToKebabCase, isArray, isFunction, isObject, isString, normalizeToArray } from "@rue/utils";
import { composeBindings, toSetup } from "../component/bindings";
import { ComponentTag } from "../component/Component";
import { RenderSlot } from "../component/x-Input";
import { ComponentConfig, ElementConfig, RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { $from } from "../utils/destructure";
import { toString } from '../node/VineNode'
import { isComponentKit } from "@rue/nextscript";
import { instantUpdate, Ion, isGetter, toValue } from "@rue/quarky";
import { isBooleanAttribute } from "../element/attributes";
import { ReactiveClasses, TagClass, TagStyle } from "../element/styles";
import { AnyObject, Booleanny, Falsey } from "@rue/types";
import { Provided, RootContext } from "../context/Context";
import { Flask, flaskStack } from "@rue/flask";
import { InnerHTMLKit, isInnerHTMLKit } from "../node/InnerHTML";
import { createRootContext } from "../context/provide";
import { popContext, pushContext } from "../context/context-stack";
import { escapeHTML } from "@rue/utils"

const selfclosing = {
  "area": true,
  "base": true,
  "br": true,
  "col": true,
  "embed": true,
  "hr": true,
  "img": true,
  "input": true,
  "link": true,
  "meta": true,
  "param": true,
  "source": true,
  "track": true,
  "wbr": true
}


export function writeElement(
  tagName: string,
  Slot: RenderSlot | undefined,
  bindings: ElementConfig,
) {
  if (tagName in selfclosing) return { element: `<${tagName}${renderBindings(bindings)}>` }
  return { element: `<${tagName}${renderBindings(bindings)}>${renderSlot(Slot)}</${tagName}>` }
}

function getValue(value: any) {
  return toString(isGetter(value) ? toValue(value()) : value)
}

function renderBindings(bindings: ElementConfig) {
  const { attributes, classes, microclasses, styles, showIf, transitions /* TODO: */ } = composeBindings(bindings)
  let renderedAttributes = ''

  if (attributes) renderedAttributes += genAtrributes(attributes)
  if (classes || microclasses) {
    const classString = classes ? genClasses(normalizeToArray(classes)) : '' + microclasses ? ' ' + toValue(microclasses) : ''
    if (classString)
      renderedAttributes += ` class="${classString}"`
  }
  if (styles || showIf) {
    const styleString = genStyles(styles, showIf)
    if (styleString)
      renderedAttributes += ` style="${styleString}"`
  }

  return renderedAttributes
}

function genAtrributes(attributes: AnyObject) {
  let attrs = ""
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'ref') continue;
    const _key = key.startsWith('mu:') ? key.slice(3) : key;
    if (__DEV__ && key.startsWith('mu:')) console.warn(`The attribute ${_key} is not a valid two-way binding attribute`)
    // valid two-way binding should have already been removed with by bindViewInput, so any remaining 'mu:' keys are invalid
    const val = getValue(value)
    if (_key === 'width') console.log('attribute!!', key, val)
    attrs += isBooleanAttribute(_key) && val
      ? ` ${_key}`
      : ` ${_key}="${val}"`
  }
  return attrs;
}

function genClasses(classes: TagClass[]) {
  let classString = ''
  for (const entry of classes) {
    if (!entry) continue;
    classString += addClasses(getValue(entry))
  }
  return classString.trim()
}

function addClasses(value: string | Falsey | { [key: string]: Booleanny }) {
  if (!value) {
    return;
  }
  else if (isString(value)) {
    return ` ` + value.trim()
  }
  else if (isObject(value)) {
    return classesFromObject(value)
  }
  else {
    if (__DEV__) console.warn('DEV RESEARCH: Reactive class input has not been handled for', value)
  }
}

function classesFromObject(entry: ReactiveClasses) {
  let classString = ''
  for (const key in entry) {
    const active = getValue(entry[key])
    if (active) classString += ` key`
  }
}


function genStyles(styles: TagStyle[] | undefined, showIf: Ion<Booleanny> | undefined) {
  let styleString = ""
  if (styles)
    for (const entry of styles) {
      styleString += genStyle(entry)
    }
  if (showIf) {
    if (!toValue(showIf)) {
      styleString += ` display: none;`
    }
  }
  return styleString.trim()
}

function genStyle(entry: string | AnyObject | Falsey) {
  if (isObject(entry)) {
    return genStylesFromObject(entry)
  }
  else if (entry && typeof entry === 'string') {
    return ' ' + normalizeStyle(entry) + ";"
  }
  return ''
}

function genStylesFromObject(entry: AnyObject) {
  let styles = ""
  for (const key in entry) {
    styles += genStyleProperty(key, getValue(entry[key]))
  }
}

function genStyleProperty(key: string, value: string | number | Falsey) {
  if (!value) return ''
  return ' ' + key + ': ' + String(value) + ';'
}


function normalizeStyle(expression: string) {
  expression.trim();
  if (expression.endsWith(';')) return expression.substring(0, expression.length - 1);
  return expression;
}


function renderSlot(Slot: RenderSlot | undefined,) {
  if (!Slot) return ''
  const output = normalizeToArray(typeof Slot === 'function' ? Slot() : Slot)
  if (isInnerHTMLKit(output[0])) return writeInnerHTML(output[0])
  return joinIsland(processJSXOutput(output))
}

function writeInnerHTML(kit: InnerHTMLKit) {
  if (!kit.trusted) {
    console.warn('Untrusted HTML cannot be rendered. Sanitize if untrusted, and mark as trusted')
  }
  return toValue(kit.html)
}


/**
 * - spread arrays and components into root array
 * - get rid of undefined
 * @param jsxNodes 
 */
export function processJSXOutput(jsxNodes: RawJSXNode[], flattened: string[] = []) {
  for (const node of jsxNodes) {
    if (isObject(node) && 'element' in node) {
      flattened.push(node)
    }
    else if (Array.isArray(node)) {
      processJSXOutput(node, flattened)
    }
    else if (isComponentKit(node)) {
      processJSXOutput(node.nodes as RawJSXNode[], flattened)
    }
    else if (isFunction(node)) {
      if (node.length !== 0) throw new Error('render functions must have no parameters')
      flattened.push(escapeHTML(toString(node())))
    }
    else if (node == null || node === '') {
      continue;
    }
    else {
      flattened.push(escapeHTML(toString(node)))
    }
  }
  return flattened;
}

export function writeComponent(
  Component: ComponentTag,
  fromTag: ComponentConfig,
) {
  const setup = toSetup(fromTag) // TODO: SSR version of toSetup?
  return processJSXOutput(normalizeToArray(Component($from(setup))))
}

if (typeof window === 'undefined') {
  globalThis.window = undefined
  globalThis.document = undefined
}

export function writeIsland(render: RenderFunction) {
  const flask = new Flask({ type: 'view' });
  const rootContext = createRootContext()
  try {
    pushContext(rootContext)
    flaskStack.push(flask)
    flask.emitInitialMount()
    const output = instantUpdate(() =>
      joinIsland(processJSXOutput(normalizeToArray(render())))
    )
    return output
  }
  finally {
    popContext()
    flaskStack.pop()
  }
}

function joinIsland(array: (string | { element: string[] })[]) {
  let html = ''
  for (const item of array) {
    if (Array.isArray(item)) {
      html += joinIsland(item)
    }
    else if (isObject(item) && 'element' in item) {
      html += item.element
    }
    else {
      html += item
    }
  }
  return html;
}


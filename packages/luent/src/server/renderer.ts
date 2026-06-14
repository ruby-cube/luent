import { camelToKebabCase, isFunction, isObject, isString, normalizeToArray } from "@rue/utils";
import { composeBindings, toSetup } from "../component/bindings";
import { ComponentTag } from "../component/Component";
import { RenderSlot } from "../component/x-Input";
import { ComponentConfig, ElementConfig, RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { $from } from "../utils/destructure";
import { toString } from '../node/VineNode'
import { isComponentKit } from "@rue/nextscript";
import { Ion, isGetter, toValue } from "@rue/quarky";
import { isBooleanAttribute, setUpAttributes } from "../element/attributes";
import { ReactiveClasses, TagClass, TagStyle } from "../element/styles";
import { AnyObject, Booleanny, Falsey } from "@rue/types";
import { Provided, RootContext } from "../context/Context";
import { Flask, flaskStack } from "@rue/flask";

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


export function renderElement(
  tagName: string,
  Slot: RenderSlot | undefined,
  bindings: ElementConfig,
) {
  if (tagName in selfclosing) return `<${tagName}${renderBindings(bindings)}>`
  return `<${tagName}${renderBindings(bindings)}>${renderSlot(Slot)}</${tagName}>`
}

function getValue(value: any) {
  return toString(isGetter(value) ? toValue(value()) : value)
}

function renderBindings(bindings: ElementConfig) {
  const { attributes, classes, microclasses, styles, showIf, transitions /* TODO: */ } = composeBindings(bindings)
  let renderedAttributes = ''

  if (attributes) renderedAttributes += genAtrributes(attributes)
  if (classes) {
    const classString = genClasses(normalizeToArray(classes))
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
  for (const [key, value] of Object.entries(attributes)) {
    const _key = key.startsWith('mu:') ? key.slice(3) : key;
    if (__DEV__ && key.startsWith('mu:')) console.warn(`The attribute ${_key} is not a valid two-way binding attribute`)
    // valid two-way binding should have already been removed with by bindViewInput, so any remaining 'mu:' keys are invalid
    const value = getValue(attributes[key])
    return isBooleanAttribute(key) && value
      ? ` ${key}`
      : ` ${key}="${value}"`
  }
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
    if (!getValue(showIf)) {
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
  return processJSXOutput(typeof Slot === 'function' ? Slot() : Slot).join(" ")
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

export function renderComponent(
  Component: ComponentTag,
  fromTag: ComponentConfig,
) {
  const setup = toSetup(fromTag) // TODO: SSR version of toSetup?
  return processJSXOutput(Component($from(setup))).join(" ")
}




export function renderToString<T extends AnyObject, E extends Provided>(App: ComponentTag<T> | RenderFunction, config?: { provide?: E, remountable?: boolean, groundContext?: RootContext, setup?: T }) {
  const flask = new Flask({ type: 'view' });
  try {
    flaskStack.push(flask)
    flask.emitInitialMount()
    console.log('RENDER TO STRING')
    const output = processJSXOutput(App()).join(' ')
    console.log('OUTPUT????', output)
    return output
  }
  finally {
    flaskStack.pop()
  }
}



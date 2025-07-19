import { DOMNode, Slot } from "../component/Component";
import { isIon, watch, isManagedDerivation, Ion, MutableIon, getCurrentPhase } from "@rue/quarky";
import { isFunction, isObject, isObjectLiteral, isString, noop, normalizeToArray } from "@rue/utils";
import { ClassInput, ElementConfig, makeNode, JSXNode, StyleInput, RawJSXNode } from "../node/makeNode";
import { $listen, Flask, SustainedListenerOptions } from "@rue/flask";
import { mountNodeEntities } from "../node/mountNodeKits";
import { isHydrating } from "../hydration/hydration";
import { getElement } from "../hydration/getElement";
import { AnyObject, Booleanny } from "@rue/types";
import { isHTMLEvent } from "./attributes";
import { flattenJSXOutput, MutableKit, setUpNodeEntities } from "../node/setUpNodeEntities";
import { initializeListRef, initializeRef, isAnyNodeRef, NodesRef, isNodesRef } from "../node/NodeRef";
import { camelToKebabCase } from "@rue/utils";
import { NodePod } from "../node/NodePod";
import { MaybeIon } from "../component/Input";
import { isFlaskLifecycleHook, setUpHooks } from "../flask/template-hooks";
import { runWithXMLNamespace, createNSElement, getXMLNamespace, newXMLNamespace, XMLNamespaceStack } from "./NSElement";
import { isInnerHTMLKit, mountInnerHTML, setUpInnerHTML } from "../node/InnerHTML";
import { queueInternalRender, RUN_EAGERLY, watchForRender } from "../render-cycle";
import { getViewFlask } from "../flask/ViewFlask";


export type HTMLTag = keyof HTMLElementTagNameMap



export function makeElement(
   tagName: string,
   Slot: Slot | undefined,
   config: ElementConfig,
   $index: Ion<number> | undefined
): DOMNode {
   const { class: classes, style: styles, ref, ...other } = config;

   const { attributes, events, hooks } = analyzeAttributes(other)

   let newXML_NS: string | undefined;
   const XML_NS = (newXML_NS = newXMLNamespace(tagName, attributes)) || getXMLNamespace();

   const domNode = isHydrating() ? getElement()
      : XML_NS ? createNSElement(tagName, XML_NS)
         : document.createElement(tagName)


   if (ref) {
      if (!isAnyNodeRef(ref)) throw new Error("INVALID INPUT: Must use NodeRef or NodesRef as ref")
      if (isNodesRef(ref)) {
         initializeListRef(<NodesRef>ref, domNode, $index!)
      }
      else {
         initializeRef(ref, domNode)
      }
   }

   if (classes) setUpClasses(domNode, normalizeToArray(classes))
   if (styles) setUpStyles(domNode, normalizeToArray(styles))
   setUpEvents(domNode, events);
   setUpHooks(domNode, hooks)

   const _Slot = bindView(domNode, Slot, attributes)
   setUpAttributes(domNode, attributes);
   //  if (dynamicAttributes)
   //      setUpDynamicAttributes(
   //          domNode,
   //          //@ts-expect-error
   //          dynamicAttributes
   //      );


   if (_Slot) {
      const xml_ns = newXML_NS ? newXML_NS : tagName === 'foreignObject' ? undefined : XML_NS
      runWithXMLNamespace(() => {
         const rawOutput = normalizeToArray(toOutput(_Slot))
         const flattenedOutput = flattenJSXOutput(rawOutput)
         if (isInnerHTMLKit(rawOutput[0])) {
            const innerHTML = setUpInnerHTML(rawOutput[0], domNode)
            mountInnerHTML(innerHTML, domNode)
         }
         else {
            const nodeEntities = setUpNodeEntities(flattenedOutput, domNode, new NodePod())
            mountNodeEntities(nodeEntities, domNode)
         }
      }, xml_ns)
   }
   return domNode;
}

function toOutput(value: unknown) {
   return isFunction(value) ? value() : value;
}




// function wrapIfConditionalSeries(nodeEntities: JSXNode[]) {
//     if (isNotConditionalSeries(nodeEntities)) {
//         return nodeEntities;
//     }
//     validateConditionalSeries(nodeEntities, false)
//     return [nodeEntities];
// }


// function isNotConditionalSeries(nodeEntities: JSXNode[]) {
//     return !(nodeEntities[0] instanceof ConditionalRenderKit) ||
//         !(nodeEntities[nodeEntities.length - 1] instanceof ConditionalRenderKit)
// }

// function validateConditionalSeries(nodeEntities: ConditionalRenderKit[], isNotConditionalSeries: false) {
//     if (isNotConditionalSeries !== false)
//         throw new Error(`validateConditionalSeries must be called after isNotConditionalSeries`)
//     if (nodeEntities[0].statementType !== 'if' || nodeEntities[nodeEntities.length - 1].statementType === 'if')
//         throw new Error("Invalid conditional series")
//     for (let i = 1; i < nodeEntities.length - 1; i++) {
//         const nodeEntity = nodeEntities[i];
//         if (!(nodeEntity instanceof ConditionalRenderKit) || nodeEntity.statementType === 'if' || nodeEntity.statementType == 'else')
//             throw new Error("Invalid conditional series")
//     }
// }

function analyzeAttributes(entries: AnyObject) {
   const events: AnyObject = {};
   const attributes: AnyObject = {};
   const hooks: AnyObject = {}
   for (const key in entries) {
      if (key === "children") {
         continue;
      }
      else if (isHTMLEvent(key)) {
         events[key.slice(3)] = entries[key]; // on:
      }
      else if (isFlaskLifecycleHook(key)) {
         hooks[key] = entries[key] // at:
      }
      else {
         attributes[key] = entries[key];
      }
   }
   return {
      attributes,
      events,
      hooks,
      // jsxProps
   }
}

function isMutableIon(ion: unknown): ion is MutableIon<any> {
   return isIon(ion) && (('state' in ion) || ('set' in ion))
}

function bindView(element: Element, Slot: Slot | undefined, attributes: { [key: string]: MutableKit | MaybeIon<any> }) {
   switch (element.tagName) {
      case 'INPUT':
         bindInput(<HTMLInputElement>element, attributes)
         return Slot;

      case 'SELECT':
         bindSelect(<HTMLSelectElement>element, attributes)
         return Slot;

      case 'TEXTAREA':
         return bindTextarea(<HTMLTextAreaElement>element, Slot);

      default:
         return Slot;
   }
}

function bindCheckboxInput(element: HTMLInputElement, attributes: { [key: string]: MutableKit | MaybeIon<any> }) {
   if (!('mu:checked' in attributes))
      return;
   const ion = attributes['mu:checked'];
   delete attributes['mu:checked'];
   attributes.checked = ion;
   if (!isMutableIon(ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work')
   }
   else {
      setUpInputListener(element, ion, 'checked')
   }
}
function bindRadioInput(element: HTMLInputElement, attributes: { [key: string]: MutableKit | MaybeIon<any> }) {
   if (!('mu:checked' in attributes))
      return;
   const ion = attributes['mu:checked'];
   const radioValue = attributes.value;
   delete attributes['mu:checked'];
   attributes.checked = function $drv() { return ion() === radioValue };
   if (!isMutableIon(ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work')
   }
   else {
      setUpInputListener(element, ion)
   }
}
function bindTextInput(element: HTMLInputElement, attributes: { [key: string]: MutableKit | MaybeIon<any> }) {
   if (!('mu:value' in attributes))
      return;
   const ion = attributes['mu:value'];
   delete attributes['mu:value'];
   attributes.value = ion;
   if (!isMutableIon(ion)) {
      if (__DEV__) console.warn('mu:value must receive a mutable ion for two-way binding to work')
   }
   else {
      setUpInputListener(element, ion)
   }
}

function bindInput(element: HTMLInputElement, attributes: { [key: string]: MutableKit | MaybeIon<any> }) {
   switch (attributes.type) {
      case 'radio':
         bindRadioInput(element, attributes)
         break;

      case 'checkbox':
         bindCheckboxInput(element, attributes)
         break;

      default:
         bindTextInput(element, attributes)
         break;
   }
}

function bindSelect(element: HTMLSelectElement, attributes: { [key: string]: MutableKit | MaybeIon<any> }) {
   if (!('mu:value' in attributes))
      return;
   const ion = attributes['mu:value'];
   const flask = getViewFlask()
   watchForRender(ion, () => {
      queueInternalRender(() => {
         element.value = toString(ion())
      }, flask)
   }, flask, RUN_EAGERLY)
   delete attributes['mu:value'];
   if (!isMutableIon(ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work')
   }
   else {
      element.addEventListener('change', e => {
         updateIonWithInput(ion, e)
      })
   }
}


function bindTextarea(element: Element, Slot: Slot | undefined) {
   if (!Slot || !isFunction(Slot)) return;
   const nodeEntities = Slot();
   const kit = nodeEntities instanceof Array ? nodeEntities[0] : nodeEntities;
   if (!isObjectLiteral(kit) && !('mu' in kit)) return;
   const ion = kit.mu;
   if (!isMutableIon(ion)) {
      if (__DEV__) console.warn('mu:value must receive a mutable ion for two-way binding to work')
   }
   else {
      setUpInputListener(element, ion)
   }
   return ion;
}

function setUpCheckboxInputListener(element: Element, ion: { state: any } | { set: (value: any) => any }) {
   element.addEventListener('input', e => {
      updateIonWithInput(ion, e, 'checked')
   })
}

function setUpInputListener(element: Element, ion: { state: any } | { set: (value: any) => any }, key: string = 'value') {
   element.addEventListener('input', e => {
      updateIonWithInput(ion, e, key)
   })
}

function updateIonWithInput(ion: { state: any } | { set: (value: any) => any }, e: Event, key: string = 'value') {
   if (isManagedDerivation(ion) && 'set' in ion) {
      ion.set(
         //@ts-expect-error
         e.target[key]
      )
   }
   else if ('state' in ion) {
      ion.state =
         //@ts-expect-error
         e.target[key];
   }
   else {
      throw new Error('invalid two-way binding')
   }
}

// type ViewBindingKit = {
//    ion: { state: any } | { set: (value: any) => any };
//    isSameAsView: (value: any) => boolean;
// }

// function isViewBindingKit(value: any): value is ViewBindingKit {
//    return 'fromInput' in value;
// }

function setUpAttributes(node: Element, attributes: { [key: string]: MaybeIon<any> }) {
   const flask = getViewFlask()
   for (const key in attributes) {
      const _key = key.startsWith('mu:') ? key.slice(3) : key;
      if (__DEV__ && key.startsWith('mu:')) console.warn(`The attribute ${_key} is not a valid two-way binding attribute`)
      // valid two-way binding should have already been removed with by bindViewInput, so any remaining 'mu:' keys are invalid
      const value = attributes[key]
      //TODO: only attributes that affect layout should be scheduled for render phase
      if (isIon(value)) {
         watchForRender(value, () => {
            queueInternalRender(() => {
               setAttribute(node, _key, value())
            }, flask)
         }, flask, RUN_EAGERLY)
      }
      // else if (isViewBindingKit(value)) {
      //    watch(value.ion, ({ newState }) => {
      //       if (value.isSameAsView(newState)) {
      //          return;
      //       }
      //       setAttribute(node, _key, newState)
      //    }, { eager: true, phase: Phase.RENDER })
      // }
      else if (!isHydrating()) {
         setAttribute(node, _key, toString(value))
      }
   }
}

function setAttribute(node: AnyObject, attribute: string, value: any) {

   if (isBooleanAttribute(attribute)) {
      const _value = Boolean(value)
      if (_value === false) node.removeAttribute(attribute)
      else node.setAttribute(attribute, _value)
   }
   else if (node instanceof SVGElement || isAttributeOnly(attribute)) {
      node.setAttribute(attribute, toString(value) ?? '')
   }
   else {
      node[toElementProperty(attribute)] = isNumberValue(attribute) ? toNumber(value) : toString(value) ?? '';
   }
}

function toNumber(value: any) {
   const type = typeof value;
   return type === 'string' ? Number(value) : type === 'number' ? value : undefined
}

//TODO:
// HTML Attribute | DOM Property | Notes
// value (on <option>) | value | JS returns the value set by DOM, not necessarily the attribute.

//TODO:
// Writable properties with no html attribute
// innerText	Represents the visible text content of an element, considering CSS visibility/display.
// valueAsNumber	For <input type="number">, represents the value as a number.
// valueAsDate	For <input type="date">, represents the value as a Date object.
// scrollTop	Number of pixels the element’s content is scrolled vertically.
// scrollLeft	Number of pixels the element’s content is scrolled horizontally.

const attributeOnly = {
   "role": true,           // Role attribute
   "nonce": true,          // Script/Style nonce attribute
   "crossorigin": true,    // Cross-origin attribute
   "integrity": true,      // Subresource Integrity attribute
   "http-equiv": true,     // Meta http-equiv attribute
   "content": true,        // Meta content attribute
   "charset": true,        // Meta charset attribute
   "itemprop": true,       // Microdata itemprop attribute
   "itemscope": true,      // Microdata itemscope attribute
   "itemtype": true,       // Microdata itemtype attribute
   "manifest": true,       // Manifest attribute (deprecated)
   "part": true            // Web components part attribute
};

function isAttributeOnly(attribute: string) {
   if (attribute.startsWith('aria-') || attribute.startsWith('data-')) return true;
   return attribute in attributeOnly
}


const attributeToPropertyMap: Record<string, string> = {

   // Global/common attributes
   for: 'htmlFor',
   accesskey: 'accessKey',
   contenteditable: 'contentEditable',
   tabindex: 'tabIndex',
   spellcheck: 'spellCheck',
   autocapitalize: 'autoCapitalize',
   inputmode: 'inputMode',

   // Form-related attributes
   readonly: 'readOnly',
   maxlength: 'maxLength',
   minlength: 'minLength',
   formaction: 'formAction',
   formenctype: 'formEnctype',
   formmethod: 'formMethod',
   formnovalidate: 'formNoValidate',
   formtarget: 'formTarget',

   // Table attributes
   colspan: 'colSpan',
   rowspan: 'rowSpan',

   // Media/iframe
   usemap: 'useMap',
   frameborder: 'frameBorder',
   allowfullscreen: 'allowFullscreen',

   // non-html attributes
   scrolltop: 'scrollTop',
   scrollleft: 'scrollLeft'
}


function toElementProperty(attribute: string) {
   return attributeToPropertyMap[attribute] ?? attribute;
}

const booleanAttributes = {
   async: true,
   autofocus: true,
   autoplay: true,
   checked: true,
   controls: true,
   default: true,
   defer: true,
   disabled: true,
   formnovalidate: true,
   hidden: true,
   inert: true,
   ismap: true,
   itemscope: true,
   loop: true,
   multiple: true,
   muted: true,
   nomodule: true,
   novalidate: true,
   open: true,
   playsinline: true,
   readonly: true,
   required: true,
   reversed: true,
   selected: true,
   truespeed: true,
};

const numberTypedAttributes: Record<string, true> = {
   // Form/input-related
   maxlength: true,
   minlength: true,
   tabindex: true,
   size: true,
   rows: true,
   cols: true,

   // Table
   colspan: true,
   rowspan: true,

   // Media/image
   width: true,
   height: true,

   // Meter/progress
   // value: true,     // for <meter>, <progress>
   min: true,
   max: true,
   low: true,
   high: true,
   optimum: true,

}


function isBooleanAttribute(attribute: string) {
   return attribute in booleanAttributes
}

function isNumberValue(attribute: string) {
   return attribute in numberTypedAttributes
}

function toString(value: any) {
   return value.toString(); //TODO: make sure it works with any value
}

//TODO: figure out how to incorporate options into inline events
function setUpEvents(node: Element, events: { [key: string]: EventListener[] }, options?: SustainedListenerOptions & AddEventListenerOptions) {

   for (const key in events) {
      const handlers = normalizeToArray(events[key]);
      for (const handler of handlers) {
         $listen(handler, options ? (options.preserve = true, options) : { preserve: true }, {
            // preserve since there is no need to pause listener when it is unmounted--it will never be triggered
            enroll: (cb) => {
               node.addEventListener(key, cb, options);
            },
            remove: (cb) => {
               node.removeEventListener(key, cb, options);
            }
         })
      }

   }
}




type DynamicClassesConfig = {
   [key: string]: MaybeIon<Booleanny>;
}

type Falsey = undefined | null | false | ''
function setUpClasses(node: Element, classes: ClassInput[]) {
   const flask = getViewFlask()
   const classList = node.classList

   for (const entry of classes) {
      if (isIon(entry)) {
         watchForRender(entry, (previous/* newState: DynamicClassesConfig | string | Falsey, oldState: DynamicClassesConfig | string | Falsey */) => {
            queueInternalRender(() => {
               const current = entry()
               if (previous) removePreviousClasses(previous, classList)
               if (current) addClasses(current, classList, flask)
            }, flask)
         }, flask, RUN_EAGERLY)
      }
      else if (entry) {
         addClasses(entry, classList, flask)
      }
   }
}

function removePreviousClasses(prevValue: string | AnyObject, classList: DOMTokenList) {
   if (isString(prevValue)) {
      const prevClasses = prevValue && prevValue.split(' ')
      if (prevClasses)
         for (const prevClass of prevClasses) {
            classList.remove(prevClass);
         }
   }
   else if (isObject(prevValue)) {
      for (const key in prevValue) {
         const value = prevValue[key]
         if (value) {
            classList.remove(key)
         }
      }
   }
   else if (__DEV__) {
      console.warn('DEV RESEARCH: Reactive class input has not been handled for', prevValue)
   }
}


function addClasses(value: string | Falsey | { [key: string]: Booleanny }, classList: DOMTokenList, flask: Flask) {
   if (!value) {
      return;
   }
   else if (isString(value)) {
      setUpClassesFromString(value, classList)
   }
   else if (isObject(value)) {
      setUpClassesFromObject(value, classList, flask)
   }
   else {
      if (__DEV__) console.warn('DEV RESEARCH: Reactive class input has not been handled for', value)
   }
}

// let __debug__=false;
// // export function initDebugger(){
// // __debug__ = true
// // }

function setUpClassesFromObject(entry: DynamicClassesConfig, classList: DOMTokenList, flask: Flask) {
   for (const key in entry) {
      const value = entry[key]
      if (isIon(value)) {
         watchForRender(value, (previous) => {
            queueInternalRender(() => {
               if (value()) classList.add(key)
               else if (previous) classList.remove(key)
            }, flask)
         }, flask, RUN_EAGERLY)
      }
      else if (value) {
         classList.add(key)
      }
      else {
         classList.remove(key)
      }
   }
}

function setUpClassesFromString(classString: string, classList: DOMTokenList) {
   const classes = classString.split(' ')
   for (const activeClass of classes) {
      classList.add(activeClass)
   }
}

// function warnDuplicateClasses(classesA: string, classesB: string) {

//    const aClasses = new Set(classesA.split(' '))
//    const bClasses = classesB.split(' ')
//    for (const className of bClasses) {
//       if (aClasses.has(className)) {
//          console.warn(`Duplicate class name: ${className}`);
//          console.trace();
//       }
//    }
// }

function setUpStyles(node: Element, styles: StyleInput[]) {
   const flask = getViewFlask()
   const style = (<HTMLElement | SVGAElement | MathMLElement>node).style;
   for (const entry of styles) {
      if (isIon(entry)) {
         watchForRender(entry, (/* value: string | AnyObject | Falsey */) => {
            queueInternalRender(() => {
               setUpStyleEntry(style, entry(), flask);
            }, flask)
         }, flask, RUN_EAGERLY)
      }
      else {
         setUpStyleEntry(style, entry, flask)
      }
   }
}

function setUpStyleEntry(style: CSSStyleDeclaration, entry: string | AnyObject | Falsey, flask: Flask) {
   if (entry instanceof Object) {
      for (const key in entry) {

         const value = entry[key] as MaybeIon<string | number | Falsey>;
         if (isIon(value)) {
            watchForRender(value, () => {
               queueInternalRender(() => {
                  assignStyleProperty(style, toStylePropertyName(key), value())
               }, flask)
            }, flask, RUN_EAGERLY)
         }
         else {
            assignStyleProperty(style, toStylePropertyName(key), value)
         }
      }
   }
   else if (typeof entry === 'string') {
      style.cssText = style.cssText + "; " + normalizeStyle(entry)
   }
}

function toStylePropertyName(key: string) {
   return key.startsWith('$') ? key.slice(1) : key;
}

function assignStyleProperty(style: AnyObject, property: string, value: string | number | Falsey) {
   const key = camelToKebabCase(property)
   if (value != null) {
      const splitValue = typeof value === 'string' ? value.split(' !importan') : undefined; // ['red', 't'] 
      const _value = String(splitValue ? splitValue[0] : value);
      if (splitValue === undefined || splitValue.length === 1) {
         style.setProperty(key, _value)
      }
      else {
         style.setProperty(key, _value, { priority: 'important' })
      }
   }
   else {
      style.removeProperty(key)
   }
}






function normalizeStyle(expression: string) {
   expression.trim();
   if (expression.endsWith(';')) return expression.substring(0, expression.length - 1);
   return expression;
}

function warnOverlappingStyles(stylesA: string, stylesB: string) {
   const aStyles = new Set(stylesA.split('; '))
   const bStyles = stylesB.split('; ')
   for (const styling of bStyles) {
      if (aStyles.has(styling)) {
         console.warn(`Duplicate styling: ${styling}`);
         console.trace();
      }
   }
}

// function setUpDynamicAttributes(node: Element, changes: ((o: Element) => void)[] | ((o: Element) => void)) {
//    if (isFunction(changes)) {
//       watchRenderEffect(() => changes(node)) // watchAndPreserve?
//    }
//    else {
//       for (const change of changes) {
//          watchRenderEffect(() => change(node))
//       }
//    }
// }

// function setUpRefNulling(ref: NodePod, $index: AtomicIon<number>) {
//     if ($index && $index() === 0) {

//     }
//     else {
//         atUnmount(() => {

//         })
//     }
// }







//    0                               1    2
// [[node, [maybe dynamic pod]], [ ], [ ]] --- dynamic pod
//  |                                 |
//  active pod                   inactive pod
//
// 
// [activeKit, kit, kit] --- conditionalKits
//


import { isIon, Ion, MutableIon, isGetter, swiftUpdate, instantUpdate, watchToRender, RUN_EAGERLY, queueRender, PRELUDE, toValue, INTERNAL, queueTask, queueIonicTask, queueIonicPrelude } from "@rue/quarky";
import { isFunction, isObject, isPlainObject, isString, noop, normalizeToArray } from "@rue/utils";
import { ClassInput, ElementConfig, StyleInput } from "../node/makeJSXNode";
import { $listen, Flask, getActiveFlask, getFlask, SustainedListenerOptions } from "@rue/flask";
import { isHydrating } from "../hydration/hydration";
import { getElement } from "../hydration/getElement";
import { AnyObject, Booleanny } from "@rue/types";
import { getEventUpdater, isHTMLEvent } from "./attributes";
import { initializeRef, isAnyNodeRef, isNodesRef } from "../node/NodeRef";
import { camelToKebabCase } from "@rue/utils";
import { isFlaskLifecycleHook, setUpHooks } from "../flask/template-hooks";
import { runWithXMLNamespace, createNSElement, getXMLNamespace, newXMLNamespace, XMLNamespaceStack } from "./NSElement";
import { RenderSlot, MaybeIon } from "../component/Input";
import { DOMNode, mountDOMNodes, processJSXOutput, setUpNodeVine } from "../node/VineNode";
import { NodeRefsConfig, setUpNodeRefs } from "../node/NodeRefs";
import { $Index } from "../iteratives/ItemList";
import { setUpTransitions } from "../transitions/transitions";
import { getTransition, setTransition } from "../transitions/Transition";
import { matchEventTarget } from "../events/target";
import { setUpInnerHTML } from "../node/InnerHTML";


export type TagName = keyof HTMLElementTagNameMap

// function makeElement(tag, Slot) {
//    const element = document.createElement(tag)

//    const nodes = Slot() as (VineNode & (NodeKit | CaseKit) | DOMNode)[]



// mountDOMNodes(nodes, element)

//    return element;
// }




export function makeElement(
   tagName: string,
   Slot: RenderSlot | undefined,
   config: ElementConfig,
): DOMNode {
   const { class: classes, style: styles, 'show-if': showIf, ref: $node, hooks: forwardHooks, events: forwardEvents, transitions: forwardTransitions, ...other } = config;

   const { attributes, events, hooks, transitions } = analyzeAttributes(other)
   let newXML_NS: string | undefined;
   const XML_NS = (newXML_NS = newXMLNamespace(tagName, attributes)) || getXMLNamespace();

   const domNode = isHydrating() ? getElement()
      : XML_NS ? createNSElement(tagName, XML_NS)
         : document.createElement(tagName)

   if ($node) {
      if (isObject($node) && 'arr' in $node) {
         setUpNodeRefs(domNode, $node.arr, normalizeToArray($node.i))
      }
      else {
         if (!isAnyNodeRef($node)) throw new Error("INVALID INPUT: Must use NodeRef or NodeRefs as ref")
         console.log('initializing element ref', tagName)
         initializeRef($node, domNode)
      }
   }

   if (classes) setUpClasses(domNode, normalizeToArray(classes))
   if (styles) setUpStyles(domNode, normalizeToArray(styles))
   if (showIf) setUpConditionalDisplay(domNode, showIf)
   setUpEvents(domNode, { ...events, ...forwardEvents });
   setUpHooks(domNode, { ...hooks, ...forwardHooks })
   bindView(domNode, attributes)
   setUpAttributes(domNode, attributes);
   const transitionConfig = getTransition()
   setUpTransitions(domNode as HTMLElement, { ...transitions, ...forwardTransitions }, transitionConfig) // TODO: transition-in etc

   //  if (dynamicAttributes)
   //      setUpDynamicAttributes(
   //          domNode,
   //          //@ts-expect-error
   //          dynamicAttributes
   //      );


   if (Slot) {
      const xml_ns = newXML_NS ? newXML_NS : tagName === 'foreignObject' ? undefined : XML_NS
      runWithXMLNamespace(() => {
         const rawOutput = normalizeToArray(Slot())

         // if (isInnerHTMLKit(rawOutput[0])) {
         //    const innerHTML = setUpInnerHTML(rawOutput[0], domNode)
         //    mountInnerHTML(innerHTML, domNode)
         // }
         // else {
         const nodes = processJSXOutput(rawOutput)
         setUpNodeVine(nodes, domNode)
         mountDOMNodes(nodes, domNode)
      }, xml_ns)
   }
   setTransition(transitionConfig) // makes transition config available to siblings
   return domNode;
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

const transitionAttributes = {
   'transition-item': true,
   'animate-item': true,
   'transit-class': true,
   'transit-key': true,
   'transit-port': true,
   'animate-load': true,
   'animate-in': true,
   'animate-out': true,
   'transition-in-from': true,
   'transition-in': true,
   'transition-out-to': true,
   'transition-out': true, // ?? TODO:
   'cancel-transition': true, // ??? TODO:
}

function isTransition(key: string) {
   return key in transitionAttributes
}

function isNamedSlot(key: string) {
   return key.startsWith('Slot:')
}

export function analyzeAttributes(entries: AnyObject) {
   const transitions: AnyObject = {};
   const events: AnyObject = {};
   const hooks: AnyObject = {}
   const attributes: AnyObject = {};
   const namedSlots: AnyObject = entries.Slot
   for (const key in entries) {
      if (key === "children") {
         continue;
      }
      else if (isHTMLEvent(key)) {
         events[key.slice(3)] = entries[key]; // on:
      }
      else if (isTransition(key)) {
         transitions[key] = entries[key] // at:
      }
      else if (isFlaskLifecycleHook(key)) {
         hooks[key] = entries[key] // at:
      }
      else if (isNamedSlot(key)) {
         namedSlots[key.slice(5)] = entries[key]
      }
      else {
         attributes[key] = entries[key];
      }
   }
   return {
      attributes,
      events,
      hooks,
      transitions
      // jsxProps
   }
}

export function isMutableIon(ion: unknown): ion is MutableIon<any> {
   return isIon(ion) && 'value' in ion
}

function bindView(element: Element, attributes: { [key: string]: MaybeIon<any> }) {
   switch (element.tagName) {
      case 'INPUT':
         bindInput(<HTMLInputElement>element, attributes)

      case 'SELECT':
         bindSelect(<HTMLSelectElement>element, attributes)

      case 'TEXTAREA':
         return bindTextInput(<HTMLTextAreaElement>element, attributes);
   }
}

function bindCheckboxInput(element: HTMLInputElement, attributes: { [key: string]: MaybeIon<any> }) {
   if (!('mu:checked' in attributes))
      return;
   const ion = attributes['mu:checked'];
   console.log('checkbox input', ion)
   delete attributes['mu:checked'];
   attributes.checked = ion;
   if (!isGetter(ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work', ion)
   }
   else {
      setUpInputListener(element, ion, 'checked')
   }
}
function bindRadioInput(element: HTMLInputElement, attributes: { [key: string]: MaybeIon<any> }) {
   if (!('mu:checked' in attributes))
      return;
   const ion = attributes['mu:checked'];
   console.log('radio')
   const radioValue = attributes.value;
   delete attributes['mu:checked'];
   attributes.checked = () => ion() === radioValue;
   if (!isGetter(ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work', ion)
   }
   else {
      setUpInputListener(element, ion)
   }
}

function bindTextInput(element: HTMLInputElement | HTMLTextAreaElement, attributes: { [key: string]: MaybeIon<any> }) {
   if (!('mu:value' in attributes))
      return;
   const ion = attributes['mu:value'];
   delete attributes['mu:value'];
   attributes.value = ion;
   if (!isGetter(ion)) {
      if (__DEV__) console.warn('mu:value must receive a mutable ion for two-way binding to work', ion)
   }
   else {
      setUpInputListener(element, ion)
   }
}

function bindInput(element: HTMLInputElement, attributes: { [key: string]: MaybeIon<any> }) {
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

function bindSelect(element: HTMLSelectElement, attributes: { [key: string]: MaybeIon<any> }) {
   if (!('mu:value' in attributes))
      return;
   const ion = attributes['mu:value'];
   const flask = getFlask()
   watchToRender(ion, () => {
      queueRender(() => {
         queueTask(() => {
            element.value = toString(toValue(ion))
         })
      })
   }, flask, RUN_EAGERLY)
   delete attributes['mu:value'];
   if (!isGetter(ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work', ion)
   }
   else {
      element.addEventListener('change', e => {
         swiftUpdate(() => {
            updateIonWithInput(ion, e)
         })
      })
   }
}


// function bindTextarea(element: Element, Slot: RenderSlot | undefined) {
//    if (!Slot || !isFunction(Slot)) return;
//    const nodeEntities = Slot();
//    const kit = nodeEntities instanceof Array ? nodeEntities[0] : nodeEntities;
//    if (!isPlainObject(kit) && !('mu' in kit)) return;
//    const ion = kit.mu;
//    const flask = getFlask()
//    watchToRender(ion, () => {
//       queueInternalRender(() => {
//          element.value = toString(ion())
//       }, flask)
//    }, flask, RUN_EAGERLY)
//    if (!isMutableIon(ion)) {
//       if ( __DEV__) console.warn('mu:value must receive a mutable ion for two-way binding to work')
//    }
//    else {
//       setUpInputListener(element, ion)
//    }
//    return ion;
// }

function setUpCheckboxInputListener(element: Element, ion: { value: any } | { set: (value: any) => any }) {
   element.addEventListener('input', e => {
      // instantUpdate(() => {
      updateIonWithInput(ion, e, 'checked')
      // })
   })
}

function setUpInputListener(element: Element, ion: { value: any } | { set: (value: any) => any }, key: string = 'value') {
   element.addEventListener('input', e => {
      updateIonWithInput(ion, e, key)
   })
}

function updateIonWithInput(ion: { value: any } | { set: (value: any) => any }, e: Event, key: string = 'value') {
   if ('value' in ion) {
      ion.value =
         //@ts-expect-error
         e.currentTarget?.[key];
      console.log('@&@ e.currentTarget?.[key]', key, e.currentTarget?.[key])
   }
   else {
      const maybeIon = ion()
      if (isMutableIon(maybeIon)) {
         maybeIon.value =
            //@ts-expect-error
            e.currentTarget?.[key];
      }
      else {
         throw new Error('invalid two-way binding')
      }

   }
}

// type ViewBindingKit = {
//    ion: { state: any } | { set: (value: any) => any };
//    isSameAsView: (value: any) => boolean;
// }

// function isViewBindingKit(value: any): value is ViewBindingKit {
//    return 'fromInput' in value;
// }

// TODO: innerHTML
function setUpAttributes(node: Element, attributes: { [key: string]: MaybeIon<any> }) {
   const flask = getFlask()
   for (const key in attributes) {
      if (key === 'innerHTML') {
         setUpInnerHTML({ innerHTML: attributes.innerHTML }, node)
         continue;
      }
      if (key === 'Slot') continue;
      const _key = key.startsWith('mu:') ? key.slice(3) : key;
      if (__DEV__ && key.startsWith('mu:')) console.warn(`The attribute ${_key} is not a valid two-way binding attribute`)
      // valid two-way binding should have already been removed with by bindViewInput, so any remaining 'mu:' keys are invalid
      const value = attributes[key]
      // TODO: only attributes that affect layout should be scheduled for render phase
      if (isGetter(value)) {
         watchToRender(value, ({ current, previous }) => {
            // if (current === previous) return;
            queueRender(() => {
               setAttribute(node, _key, toValue(value())) // toValue for mu getters
            })
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
      const _value = value === 'true' ? true : value === 'false' ? false : Boolean(value)
      // if (_value === false) node.removeAttribute(attribute)
      // else node.setAttribute(attribute, _value)
      node[attribute] = _value
   }
   else if (node instanceof SVGElement || isAttributeOnly(attribute)) {
      node.setAttribute(attribute, toString(value) ?? '')
   }
   else {
      if (attribute === 'textContent') console.log('$$$ SETTING TEXTCONTENT', value)
      node[toElementProperty(attribute)] = isNumberValue(attribute) ? toNumber(value) : toString(value) ?? '';
   }
}

function toNumber(value: any) {
   const type = typeof value;
   return type === 'string' ? Number(value) : type === 'number' ? value : undefined
}

// TODO:
// HTML Attribute | DOM Property | Notes
// value (on <option>) | value | JS returns the value set by DOM, not necessarily the attribute.

// TODO:
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

const booleanAttributes = { // TODO: there are so many more boolean attributes
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
   return value?.toString() ?? ""; // TODO: make sure it works with any value
}

// TODO: figure out how to incorporate options into inline events
function setUpEvents(node: Element, events: { [key: string]: EventListener[] }, options?: SustainedListenerOptions & AddEventListenerOptions) {
   for (const key in events) {
      if (key === 'event') {
         const batchEvents = events.event
         for (const key in batchEvents) {
            setUpListener(node, batchEvents, key, options)
         }
         continue;
      }
      setUpListener(node, events, key, options)
   }
}

function setUpListener(node: Element, events: AnyObject, key: string, options?: SustainedListenerOptions & AddEventListenerOptions) {
   const handlers = normalizeToArray(events[key]);
   for (const handler of handlers) {
      $listen(withUpdate(handler, key), options ? (options.preserve = true, options) : { preserve: true }, {
         // preserve since there is no need to pause listener when it is unmounted--it will never be triggered
         enroll: (cb) => {
            // console.warn('^^^ adding inline event listener', handler)
            node.addEventListener(key, cb, options);
         },
         remove: (cb) => {
            // console.warn('^^^ removing inline event listener', handler)
            node.removeEventListener(key, cb, options);
         }
      })
   }
}

export function withUpdate(handler: Function, event: string) {
   const update = getEventUpdater(event) ?? swiftUpdate
   return (e: any) => update(() => {
      e.by = matchEventTarget
      handler(e)
   })
}






type DynamicClassesConfig = {
   [key: string]: MaybeIon<Booleanny>;
}

type Falsey = undefined | null | false | ''
function setUpClasses(node: Element, classes: ClassInput[]) {
   const flask = getFlask()
   const classList = node.classList

   for (const entry of classes) {
      if (isGetter(entry)) {
         watchToRender(entry, ({ current, previous }/* newState: DynamicClassesConfig | string | Falsey, oldState: DynamicClassesConfig | string | Falsey */) => {
            // if (current === previous) return;
            queueRender(() => {
               if (previous) removePreviousClasses(previous, classList)
               if (entry()) addClasses(entry(), classList, flask)
            })
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
      if (isGetter(value)) {
         watchToRender(value, ({ current, previous }) => {
            // if (current === previous) return
            queueRender(() => {
               if (value()) classList.add(key)
               else if (previous) classList.remove(key)
            })
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
      if (activeClass) classList.add(activeClass)
   }
}




// function removePreviousClasses(prevValue: string | AnyObject, classList: DOMTokenList) {
//    if (isString(prevValue)) {
//       const prevClasses = prevValue && prevValue.split(' ')
//       if (prevClasses)
//          for (const prevClass of prevClasses) {
//             classList.remove(prevClass);
//          }
//    }
//    else if (isObject(prevValue)) {
//       for (const key in prevValue) {
//          const value = prevValue[key]
//          if (value) {
//             classList.remove(key)
//          }
//       }
//    }
//    else if (__DEV__) {
//       console.warn('DEV RESEARCH: Reactive class input has not been handled for', prevValue)
//    }
// }


// function addClasses(value: string | Falsey | { [key: string]: Booleanny }, classList: DOMTokenList, flask: Flask) {
//    if (!value) {
//       return;
//    }
//    else if (isString(value)) {
//       setUpClassesFromString(value, classList)
//    }
//    // else if (isObject(value)) {
//    //    setUpClassesFromObject(value, classList, flask)
//    // }
//    else {
//       if (__DEV__) console.warn('DEV RESEARCH: Reactive class input has not been handled for', value)
//    }
// }

// let __debug__=false;
// // export function initDebugger(){
// // __debug__ = true
// // }

// function setUpClassesFromObject(entry: DynamicClassesConfig, classList: DOMTokenList, flask: Flask) {
//    for (const key in entry) {
//       const value = entry[key]
//       if (isGetter(value)) {
//          watchToRender(value, ({ current, previous }) => {
//             // if (current === previous) return
//             queueInternalRender(() => {
//                if (value()) classList.add(key)
//                else if (previous) classList.remove(key)
//             }, flask)
//          }, flask, RUN_EAGERLY)
//       }
//       else if (value) {
//          classList.add(key)
//       }
//       else {
//          classList.remove(key)
//       }
//    }
// }


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
function setUpConditionalDisplay(node: Element, $show: Ion<Booleanny>) {
   let display = node.style.display

   watchToRender($show, ({ flask, current: shouldShow, previous, eagerRun }) => {
      if (!eagerRun && shouldShow === previous) return;
      if (shouldShow) {
         queueRender(() => {
            if (!display) {
               node.style.removeProperty('display');
            }
            else {
               node.style.display = display
            }
         })
      }
      else {
         display = node.style.display
         queueRender(() => {
            node.style.display = 'none'
         })
      }
   }, getFlask(), RUN_EAGERLY)
}

function setUpStyles(node: Element, styles: StyleInput[]) {
   const flask = getFlask()
   const style = (<HTMLElement | SVGAElement | MathMLElement>node).style;
   for (const entry of styles) {
      if (isGetter(entry)) {
         watchToRender(entry, ({ current, previous }) => {
            // if (current === previous) return;
            queueRender(() => {
               setUpStyleEntry(style, entry(), flask);
            })
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
         if (isGetter(value)) {
            watchToRender(value, () => {
               queueRender(() => {
                  assignStyleProperty(style, toStylePropertyName(key), value())
               })
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
   return key.startsWith('æ') ? key.slice(1) : key;
}

function assignStyleProperty(style: AnyObject, property: string, value: string | number | Falsey) {
   const key = camelToKebabCase(property)
   if (value != null) {
      const splitValue = typeof value === 'string' ? value.split(' !importan') : undefined; // ['red', 't'] 
      const _value = String(splitValue ? splitValue[0] : value);
      if (splitValue === undefined || splitValue.length === 1) {
         // if (key === 'transform') 
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


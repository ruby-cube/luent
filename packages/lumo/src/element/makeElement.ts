import { DOMNode, Slot } from "../component/InternalComponent";
import { isIon, AtomicIon, watch, isManagedDerivation } from "@rue/quarky";
import { isFunction, isObject, isObjectLiteral, isString, noop, normalizeToArray } from "@rue/utils";
import { ClassInput, ElementConfig, makeNode, NodeEntity, StyleInput } from "../node/makeNode";
import { $listen, SustainedListenerOptions } from "@rue/flask";
import { mountNodeEntities } from "../node/mountNodeKits";
import { isHydrating } from "../hydration/hydration";
import { getElement } from "../hydration/getElement";
import { AnyObject, Booleanny } from "@rue/types";
import { isHTMLEvent } from "./attributes";
import { MutableKit, setUpNodeEntities } from "../node/setUpNodeEntities";
import { initializeListRef, initializeRef, isAnyNodeRef, NodesRef, isNodesRef } from "../node/NodeRef";
import { camelToKebabCase } from "@rue/utils";
import { NodePod } from "../node/NodePod";
import { RENDER } from "../render-cycle";
import { MaybeIon } from "../component/InputTypes";
import { isFlaskLifecycleHook, setUpHooks } from "../flask/template-hooks";
import { runWithXMLNamespace, createNSElement, getXMLNamespace, newXMLNamespace, XMLNamespaceStack } from "./NSElement";


export type HTMLTag = keyof HTMLElementTagNameMap



export function makeElement(
   tagName: string,
   Slot: Slot | undefined,
   config: ElementConfig,
   $index: AtomicIon<number> | undefined
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

   // console.log('@% -----------------')
   // console.log('@% before set', tagName, prevXMLNS, activeXMLNS)

   // console.log('@% after set', prevXMLNS, activeXMLNS)
   // console.log('@% -----------------')

   if (_Slot) {
      const xml_ns = newXML_NS ? newXML_NS : tagName === 'foreignObject' ? undefined : XML_NS
      runWithXMLNamespace(() => {
         const rawOutput = normalizeToArray(isFunction(_Slot) ? _Slot() : _Slot)
         const nodePod = new NodePod();
         const nodeEntities = setUpNodeEntities(rawOutput, domNode, nodePod)
         mountNodeEntities(nodeEntities, domNode)
      }, xml_ns)
   }
   return domNode;
}



// function wrapIfConditionalSeries(nodeEntities: NodeEntity[]) {
//     if (isNotConditionalSeries(nodeEntities)) {
//         return nodeEntities;
//     }
//     validateConditionalSeries(nodeEntities, false)
//     return [nodeEntities];
// }


// function isNotConditionalSeries(nodeEntities: NodeEntity[]) {
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
   if (!isIon(ion) || !('state' in ion)) {
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
   if (!isIon(ion) || !('state' in ion)) {
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
   if (!isIon(ion) || !('state' in ion)) {
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
   watch(ion, e => {
      element.value = e.state
   }, { eager: true })
   delete attributes['mu:value'];
   if (!isIon(ion) || !('state' in ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work')
   }
   else {
      element.addEventListener('change', e => {
         updateIonWithInput(ion, e)
      })
   }
}


function bindTextarea(element: Element, Slot: Slot | undefined) {
   console.log('bindTextArea', Slot)
   if (!Slot || !isFunction(Slot)) return;
   const nodeEntities = Slot();
   const kit = nodeEntities instanceof Array ? nodeEntities[0] : nodeEntities;
   if (!isObjectLiteral(kit) && !('mu' in kit)) return;
   const ion = kit.mu;
   if (!isIon(ion) || !('state' in ion)) {
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
   for (const key in attributes) {
      const _key = key.startsWith('mu:') ? key.slice(3) : key;
      if (__DEV__ && key.startsWith('mu:')) console.warn(`The attribute ${_key} is not a valid two-way binding attribute`)
      // valid two-way binding should have already been removed with by bindViewInput, so any remaining 'mu:' keys are invalid
      const value = attributes[key]
      //TODO: only attributes that affect layout should be scheduled for render phase
      if (isIon(value)) {
         watch(value, ({ state }) => {
            console.log('updating', key, 'with', state, value())
            setAttribute(node, _key, state)
         }, { eager: true, phase: RENDER })
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

function setAttribute(node: AnyObject, key: string, value: any) {

   //TODO: what if attribute can take a falsey value like 0 or false?
   // if (value !== undefined) {
   //    // node.setAttribute(key, toString(value)) //NOTE: Programmatic checking and unchecking of check boxes breaks using setAttribute and removeAttribute
   //    node[key] = value;
   // }
   // else {
   if (node instanceof SVGElement) {
      node.setAttribute(key, value)
   }
   else {
      node[key] = value ?? '';
   }
   // node.removeAttribute(key);
   // }
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
   const classList = node.classList

   for (const entry of classes) {
      if (isIon(entry)) {
         watch(entry, ({ state, prevState }/* newState: DynamicClassesConfig | string | Falsey, oldState: DynamicClassesConfig | string | Falsey */) => {
            if (prevState) removePreviousClasses(prevState, classList)
            if (state) addClasses(state, classList)
         }, { eager: true, phase: RENDER })
      }
      else if (entry) {
         addClasses(entry, classList)
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


function addClasses(value: string | Falsey | { [key: string]: Booleanny }, classList: DOMTokenList) {
   if (!value) {
      return;
   }
   else if (isString(value)) {
      setUpClassesFromString(value, classList)
   }
   else if (isObject(value)) {
      setUpClassesFromObject(value, classList)
   }
   else {
      if (__DEV__) console.warn('DEV RESEARCH: Reactive class input has not been handled for', value)
   }
}


function setUpClassesFromObject(entry: DynamicClassesConfig, classList: DOMTokenList) {
   for (const key in entry) {
      const value = entry[key]
      if (value && isIon(value)) {
         watch(value, ({ state, prevState }) => {
            if (state) classList.add(key)
            else if (prevState) classList.remove(key)
         }, {
            eager: true,
            phase: RENDER,
         })
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
   const style = (<HTMLElement | SVGAElement | MathMLElement>node).style;
   for (const entry of styles) {
      if (isIon(entry)) {
         watch(entry, ({ state }/* value: string | AnyObject | Falsey */) => {
            setUpStyleEntry(style, state);
         }, { eager: true, phase: RENDER })
      }
      else {
         setUpStyleEntry(style, entry)
      }
   }
}

function setUpStyleEntry(style: CSSStyleDeclaration, entry: string | AnyObject | Falsey) {
   if (entry instanceof Object) {
      for (const key in entry) {
         const value = entry[key] as MaybeIon<string | number | Falsey>;
         if (isIon(value)) {
            watch(value, ({ state }) => {
               assignStyleProperty(style, toStylePropertyName(key), state)
            }, {
               eager: true,
               phase: RENDER,
               // __devName: 'setUpStyles', 
            })
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
      const splitValue = typeof value === 'string' ? value.split(' !importan') : ''; // ['red', 't'] 
      const _value = typeof value === 'string' ? splitValue[0] : value;
      if (splitValue.length === 1) {
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
//         onUnmount(() => {

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


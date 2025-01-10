import { DOMNode, Slot } from "../component/InternalComponent";
import { DerivedIon, ReactiveGet, isIon, getCurrentRenderCycle, Phase, isAtomicIon, AtomicIon } from "../../../quarky/src";
import { isFunction, noop, normalizeToArray } from "@rue/utils";
import { watchRenderEffect, watch } from "../watch/watchAndPreserve";
import { ClassInput, ElementConfig, makeNode, NodeEntity, StyleInput } from "../node/makeNode";
import { $listen, ActiveListener, ListenerOptions, PendingOp } from "@rue/flask";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { isHydrating } from "../hydration/hydration";
import { getElement } from "../hydration/getElement";
import { AnyObject, Booleanny } from "@rue/types";
import { isHTMLEvent } from "../html/attributes";
import { setUpNodeEntities } from "../node/setUpNodeEntities";
import { initializeListRef, initializeRef, isNodeRef, NodesRef } from "../node/NodeRef";
import { camelToKebabCase } from "@rue/utils";
import { $thisEffect, ThisEffect } from "../../../quarky/src/effects/ThisEffect";
import { NodePod } from "../node/NodePod";


export type HTMLTag = keyof HTMLElementTagNameMap

export function mE(
   nodeType: HTMLTag,
   Slot?: () => NodeEntity[],
   config?: ElementConfig,
): DOMNode {
   return makeNode(nodeType, Slot, config || {}) as DOMNode
}

export function makeElement<T extends keyof HTMLElementTagNameMap>(
   tagName: T,
   Slot: Slot | undefined,
   config: ElementConfig,
   $index: AtomicIon<number> | undefined
): DOMNode {
   const { class: classes, style: styles, ref, ...other } = config;

   const { attributes, events } = analyzeAttributes(other)

   const domNode = isHydrating() ? getElement() : document.createElement(tagName);

   if (ref) {
      if (!isNodeRef(ref)) throw new Error("INVALID INPUT: Must use NodeRef or NodesRef as ref")
      if ($index) {
         initializeListRef(<NodesRef>ref, domNode, $index)
      }
      else {
         initializeRef(ref, domNode)
      }
   }

   if (classes) setUpClasses(domNode, normalizeToArray(classes))
   if (styles) setUpStyles(domNode, normalizeToArray(styles))
   setUpEvents(domNode, events);
   setUpAttributes(domNode, attributes);
   //  if (dynamicAttributes)
   //      setUpDynamicAttributes(
   //          domNode,
   //          //@ts-expect-error
   //          dynamicAttributes
   //      );

   if (Slot) {
      const rawOutput = normalizeToArray(isFunction(Slot) ? Slot() : Slot)
      const nodePod = new NodePod();
      const nodeEntities = setUpNodeEntities(rawOutput, domNode, nodePod)
      mountNodeEntities(nodeEntities, domNode)
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
   // const jsxProps: AnyObject = {};
   const attributes: AnyObject = {};
   for (const key in entries) {
      if (key === "children") {
         continue;
      }
      else if (isHTMLEvent(key)) {
         events[key.slice(3)] = entries[key];
      }
      // else if (isHTMLAttribute(key, tag)) {
      // }
      else {
         attributes[key] = entries[key];
         // jsxProps[key] = jsxEntries[key];
      }
   }
   return {
      attributes,
      events,
      // jsxProps
   }
}

function setUpAttributes(node: Element, attributes: { [key: string]: any | DerivedIon<any> }) {
   for (const key in attributes) {
      const value = attributes[key]
      //TODO: only attributes that affect layout should be scheduled for render
      if (isIon(value)) {
         watch(value, (newValue) => {
            setAttribute(node, key, newValue)
         }, { eager: true, phase: Phase.RENDER })
      }
      else if (!isHydrating()) {
         node.setAttribute(key, toString(value))
      }
   }
}

function setAttribute(node: Element, key: string, value: any) {
   //TODO: what if attribute can take a falsey value like 0 or false?
   if (value) {
      node.setAttribute(key, toString(value))
   }
   else {
      node.removeAttribute(key);
   }
}

function toString(value: any) {
   return value.toString(); //TODO: make sure it works with any value
}

//TODO: figure out how to incorporate options into inline events
function setUpEvents(node: Element, events: { [key: string]: EventListener[] }, options?: ListenerOptions & AddEventListenerOptions) {
   for (const key in events) {
      const handlers = normalizeToArray(events[key]);
      for (const handler of handlers) {
         $listen(handler, options || {}, {
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
   [key: string]: ReactiveGet<Booleanny>;
}

type Falsey = undefined | null | false | ''
function setUpClasses(node: Element, classes: ClassInput[]) {
   const classList = node.classList

   for (const entry of classes) {
      if (isIon(entry)) {
         watch(entry, (value: string | Falsey, prevValue: string | Falsey) => {
            const classes = value && value.split(' ')
            const prevClasses = prevValue && prevValue.split(' ')
            if (prevClasses)
               for (const prevClass of prevClasses) {
                  classList.remove(prevClass);
               }
            if (classes)
               for (const activeClass of classes) {
                  classList.add(activeClass);
               }
         }, { eager: true, phase: Phase.RENDER })
      }
      else if (entry) {
         const classes = entry.split(' ')
         for (const activeClass of classes) {
            classList.add(activeClass)
         }
      }
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
         watch(entry, (value: string | AnyObject | Falsey) => {
            setUpStyleEntry(style, value, $thisEffect());
         }, { eager: true, phase: Phase.RENDER })
      }
      else {
         setUpStyleEntry(style, entry)
      }
   }
}

function setUpStyleEntry(style: CSSStyleDeclaration, entry: string | AnyObject | Falsey, outerEffect?: ThisEffect) {
   if (entry instanceof Object) {
      for (const key in entry) {
         const value = entry[key];
         if (isIon(value)) {
            watch(value, (value: string | number | Falsey) => {
               console.log('isIon red')
               assignStyleProperty(style, toStylePropertyName(key), value)
            }, {
               eager: true,
               phase: Phase.RENDER,
               until: outerEffect?.onCleanup
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
//         onDeactivate(() => {

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


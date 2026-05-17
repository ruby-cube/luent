import { isObject, normalizeToArray } from "@rue/utils";
import { ElementConfig, RawJSXNode } from "../node/makeJSXNode";
import { isHydrating } from "../hydration/hydration";
import { getElement } from "../hydration/getElement";
import { initializeRef, isAnyNodeRef, isNodesRef } from "../node/NodeRef";
import { setUpHooks } from "../flask/template-hooks";
import { runWithXMLNamespace, createNSElement, getXMLNamespace, newXMLNamespace, XMLNamespaceStack } from "./NSElement";
import { RenderSlot, MaybeIon } from "../component/x-Input";
import { DOMNode, mountDOMNodes, processJSXOutput, setUpNodeVine } from "../node/VineNode";
import { setUpNodeRefs } from "../node/NodeRefs";
import { setUpTransitions } from "../transitions/transitions";
import { getTransition, setTransition } from "../transitions/Transition";
import { composeBindings, composeRef } from "../component/bindings";
import { setUpAttributes } from "./attributes";
import { setUpClasses, setUpConditionalDisplay, setUpStyles } from "./styles";
import { setUpEvents } from "./events";
import { setUpMutables } from "./mutables";


export type TagName = keyof HTMLElementTagNameMap


export function makeElement(
   tagName: string,
   Slot: RenderSlot | undefined,
   bindings: ElementConfig,
): DOMNode {
   console.log('@@@before compose bindings', bindings)
   const { showIf, events, attributes, styles, classes, microclasses, hooks, transitions, mutables } = composeBindings(bindings)
   console.log('showIf', showIf)
   let newXML_NS: string | undefined;
   const XML_NS = (newXML_NS = newXMLNamespace(tagName, attributes)) || getXMLNamespace();

   const domNode = isHydrating() ? getElement()
      : XML_NS ? createNSElement(tagName, XML_NS)
         : document.createElement(tagName)

   const ref = composeRef(bindings) // throw if ref already used
   if (ref) {
      if (Array.isArray(ref)) {
         setUpNodeRefs(domNode, ref[0], normalizeToArray(ref[1]))
      }
      else {
         if (!isAnyNodeRef(ref)) throw new Error("INVALID INPUT: Must use NodeRef or NodeRefs as ref")
         initializeRef(ref, domNode)
      }
   }

   // if (microclasses) setUpMicroclasses(domNode, microclasses)
   if (classes) setUpClasses(domNode, classes)
   if (styles) setUpStyles(domNode, styles)
   if (showIf) setUpConditionalDisplay(domNode, showIf)
   if (events) setUpEvents(domNode, events);
   if (hooks) setUpHooks(domNode, hooks)
   if (mutables) setUpMutables(domNode, mutables) // FIX:
   if (attributes) setUpAttributes(domNode, attributes);
   const transitionConfig = getTransition()
   if (transitions) setUpTransitions(domNode as HTMLElement, transitions, transitionConfig) // TODO: transition-in etc

   if (Slot) {
      const xml_ns = newXML_NS ? newXML_NS : tagName === 'foreignObject' ? undefined : XML_NS
      runWithXMLNamespace(() => {
         const rawOutput = normalizeToArray(Slot())
         const nodes = processJSXOutput(rawOutput)
         setUpNodeVine(nodes, domNode)
         mountDOMNodes(nodes, domNode)
      }, xml_ns)
   }
   setTransition(transitionConfig) // makes transition config available to siblings
   return domNode;
}

// function renderSlots(slots: RenderSlot[]) {
//    const nodes: RawJSXNode[] = []
//    for (const render of slots) {
//       console.log('render?', render)
//       nodes.push(render())
//    }
//    return nodes
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

// function isNamedSlot(key: string) {
//    return key.startsWith('Slot:')
// }

// export function analyzeAttributes(entries: AnyObject) {
//    const transitions: AnyObject = {};
//    const events: AnyObject = {};
//    const hooks: AnyObject = {}
//    const attributes: AnyObject = {};
//    const namedSlots: AnyObject = entries.Slot
//    for (const key in entries) {
//       if (key === "children") {
//          continue;
//       }
//       else if (isHTMLEvent(key)) {
//          events[key.slice(3)] = entries[key]; // on:
//       }
//       else if (isTransition(key)) {
//          transitions[key] = entries[key] // at:
//       }
//       else if (isFlaskLifecycleHook(key)) {
//          hooks[key] = entries[key] // at:
//       }
//       else if (isNamedSlot(key)) {
//          namedSlots[key.slice(5)] = entries[key]
//       }
//       else {
//          attributes[key] = entries[key];
//       }
//    }
//    return {
//       attributes,
//       events,
//       hooks,
//       transitions
//       // jsxProps
//    }
// }


// type ViewBindingKit = {
//    ion: { state: any } | { set: (value: any) => any };
//    isSameAsView: (value: any) => boolean;
// }

// function isViewBindingKit(value: any): value is ViewBindingKit {
//    return 'fromInput' in value;
// }









//    0                               1    2
// [[node, [maybe dynamic pod]], [ ], [ ]] --- dynamic pod
//  |                                 |
//  active pod                   inactive pod
//
// 
// [activeKit, kit, kit] --- conditionalKits
//


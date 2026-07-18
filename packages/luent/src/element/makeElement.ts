import { isObject, normalizeToArray } from "@rue/utils";
import { ElementConfig, RawJSXNode } from "../node/makeJSXNode";
import { initializeRef, isAnyNodeRef, isNodesRef } from "../node/NodeRef";
import { setUpHooks } from "../flask/template-hooks";
import { runWithXMLNamespace, createNSElement, getXMLNamespace, newXMLNamespace, XMLNamespaceStack } from "./NSElement";
import { RenderSlot } from "../component/x-Input";
import { DOMNode, mountDOMNodes, processJSXOutput, setUpNodeVine } from "../node/VineNode";
import { setUpNodeRefs } from "../node/NodeRefs";
import { setUpTransitions } from "../transitions/transitions";
import { getTransition, setTransition } from "../transitions/Transition";
import { composeBindings, composeRef } from "../component/bindings";
import { setUpAttributes } from "./attributes";
import { setUpClasses, setUpConditionalDisplay, setUpMicroclasses, setUpStyles } from "./styles";
import { setUpEvents } from "./events";
import { setUpMutables } from "./mutables";
import { isInnerHTMLKit, setUpInnerHTML } from "../node/InnerHTML";


export type TagName = keyof HTMLElementTagNameMap

export function makeElement(
  tagName: string | Element,
  Slot: RenderSlot | undefined,
  bindings: ElementConfig
): DOMNode {
  const { showIf, events, attributes, styles, classes, microclasses, hooks, transitions, mutables } = composeBindings(bindings)

  let newXML_NS: string | undefined;
  let XML_NS: string | undefined;
  const domNode = typeof tagName === 'string' ? ((XML_NS = (newXML_NS = newXMLNamespace(tagName, attributes?.xmlns)) || getXMLNamespace())
    ? createNSElement(tagName, XML_NS)
    : document.createElement(tagName))
    : tagName;
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
  if (microclasses) setUpMicroclasses(domNode, microclasses)
  if (classes) setUpClasses(domNode, classes)
  if (styles) setUpStyles(domNode, styles)
  if (showIf) setUpConditionalDisplay(domNode, showIf)
  if (events) setUpEvents(domNode, events);
  if (hooks) setUpHooks(domNode, hooks)
  if (mutables) setUpMutables(domNode, mutables)
  if (attributes) setUpAttributes(domNode, attributes);
  if (transitions) setUpTransitions(domNode as HTMLElement, transitions) // TODO: transition-in etc
  const transitionConfig = getTransition()
  if (transitionConfig) setUpTransitions(domNode as HTMLElement, transitionConfig) // TODO: transition-in etc

  if (Slot) {
    const xml_ns = newXML_NS ? newXML_NS : tagName === 'foreignObject' ? undefined : XML_NS
    runWithXMLNamespace(() => {
      const rawOutput = normalizeToArray(Slot())
      if (isInnerHTMLKit(rawOutput[0])) {
        setUpInnerHTML(rawOutput[0], domNode)
        return;
      }
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

// case 'animate-intro':
// case 'animate-in':
// case 'animate-out':
// case 'animate-in-out':

// case 'transition-from':
// case 'from-to':
// case 'transition-to':
// case 'transition-in':
// case 'transition-out':
// case 'in-out':
// case 'transit-port':
// case 'transit-key':
// case 'transit-class':
// case 'transition-item':
// case 'animate-item':


const transitionAttributes = {
  'transition-item': true,
  'animate-item': true,

  'transit-class': true,
  'transit-key': true,
  'transit-port': true,

  'animate-intro': true,
  'animate-in': true,
  'animate-out': true,
  'animate-in-out': true,

  'transition-in': true,
  'transition-out': true,
  'in-out': true,

  'transition-to': true,
  'transition-from': true,
  'from-to': true,

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


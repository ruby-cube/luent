import { AnyObject } from "@rue/types";
import { ComponentConfig, RawJSXNode } from "../node/makeJSXNode";
import { toValue, watch } from "@rue/quarky";
import { isObject, normalizeToArray } from "@rue/utils";
import { initializeRef, InternalRef, isNodesRef } from "../node/NodeRef";
import { toInput } from "./Input";
import { JSXNode } from "../node/VineNode";
import { NodeRefsConfig, setUpNodeRefs } from "../node/NodeRefs";
import { analyzeAttributes } from "../element/makeElement";
import { setUpHooks } from "../flask/template-hooks";
import { getFlask } from "@rue/flask";




// export type Slot = JSXNode
export type ComponentTag<P extends never | AnyObject = never | AnyObject> = P extends never ? () => Component : (setup?: P) => Component

export const COMPONENT = Symbol('publicComponent')
export type PublicComponent<T extends AnyObject = AnyObject> = T // contains anything in expose


// type StyledComponent<T = {}> = {
//    exposed: T;
//    jsxNodes: RawJSXNode[];
//    ref: T extends {} ? <C>(referent: C) => Component<C> : never,
// }

export type Component<T = {}> = {
   exposed: T;
   jsxNodes: RawJSXNode[];
   // ref: T extends {} ? <C>(referent: C) => Component<C> : never,
   // style: (css: string) => StyledComponent<T>
}

export const template = Component;

type JSXTemplate = RawJSXNode

// TODO: accept a third paramenter for mountTeleported
export function Component(template: JSX.Element): Component {
   const jsxNodes = normalizeToArray(toValue(template ? unnestComponent(template) : undefined)) as RawJSXNode[]

   return {
      get exposed() { return undefined },
      jsxNodes,
   }
}

Component.as = function expose<T>(exposed: T) {
   return function Component(template: JSX.Element): Component<T> {
      const jsxNodes = normalizeToArray(toValue(template ? unnestComponent(template) : undefined)) as RawJSXNode[]

      return {
         get exposed() { return exposed as T },
         jsxNodes,
      }
   }
}



// export function Component<T>(setup: FromTag<{ as?: T }>): Component<T> {
//    const { Slot, as } = setup
//    return {
//       exposed: as as T,
//       jsxNodes: normalizeToArray(toValue(Slot ? unnestComponent(Slot()) : undefined)) as RawJSXNode[]
//    }
// }







function __DEV__leakProof(exposed: AnyObject) {
   // TODO: make sure everything has creationScopeID
}

function __DEV__assertInCreationScope(object: AnyObject) {
   // TODO: assert that object is within its creation scope
}

export function unnestComponent(jsxNodes: RawJSXNode) {
   const isArray = jsxNodes instanceof Array;
   if (isArray && jsxNodes.length > 1) return jsxNodes;
   const entity = isArray ? jsxNodes[0] : jsxNodes;
   if (isComponentKit(entity)) {
      if (entity.exposed)
         return jsxNodes;
      return entity.jsxNodes;
   }
   return jsxNodes
}

export function isComponentKit(entity: unknown): entity is Component {
   return isObject(entity) && 'exposed' in entity && 'jsxNodes' in entity
}



export type InferSlot<T extends ComponentTag = ComponentTag> =
   T extends (setup?: infer P) => any ?
   P extends { Slot: infer S } ?
   S
   : undefined
   : undefined

export type SetupWithSlot = {
   Slot: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
}

export type ComponentSetupWithSlot<P extends SetupWithSlot = SetupWithSlot> =
   (setup?: P) => JSXNode


// function toTokenList(classString: MaybeIon<string | Falsey>) {
//    if (!classString) return;
//    const classes = createTokenList()
//    if (isIon(classString)) {
//       const flask = getActiveFlask()
//       watch(classString, ({ previous, eager }) => {
//          queueInternalRender(() => {
//             const value = classString()
//             if (!eager && previous === value) return;
//             if (value) classes.value = value
//          }, flask)
//       }, { phase: PRELUDE, eager: true })

//    }
//    else {
//       classes.value = classString
//       return classes
//    }
// }

// function createTokenList() {
//    const div = document.createElement('div')
//    return div.classList
// }




export function makeComponent(
   Component: ComponentTag,
   Slot: InferSlot | undefined,
   fromTag: ComponentConfig,
   // $index: Ion<number> | undefined
): Component {
   const { ref, class: classes, style: styles, hooks: forwardHooks, events: forwardEvents, transitions: forwardTransitions, Slot: forwardSlot, ...other } = fromTag
   const { hooks, events, attributes, transitions } = analyzeAttributes(other)
   console.log('component tag config', fromTag)
   console.log('component hooks', hooks)
   console.log('component events', events)
   console.log('component attributes', attributes)
   console.log('component transitions', transitions)

   const output = Component(toInput({
      events: { ...events, ...forwardEvents },
      hooks: { flask: getFlask(), ...hooks, ...forwardHooks },
      ...attributes,
      transitions: { ...transitions, ...forwardTransitions },
      Slot: Slot ?? forwardSlot,
      classes,
      styles,
      ref
      // classes: classString
      // styles: style ? toStyleDeclaration(style) : undefined // TODO:
   }, events))
   if (output instanceof Promise)
      throw new Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup")
   const publicComponent = output.exposed
   console.log('public', publicComponent, ref)
   if (ref && publicComponent) {
      if (isObject(ref) && 'arr' in ref) {
         setUpNodeRefs(publicComponent, ref.arr, normalizeToArray(ref.i))
      }
      else {
         initializeRef(ref, publicComponent)
      }
   }
   // TODO: throw error if hooks have already been attached?
   setUpHooks(publicComponent, hooks)

   // if (tag['show-if']) setUpConditionalDisplay()
   return output
}




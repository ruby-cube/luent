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
import { JSXComponent } from "@rue/ruescript";
import type { ComponentKit } from "@rue/ruescript";




// export type Slot = JSXNode
export type ComponentTag<P extends never | AnyObject = never | AnyObject> = P extends never ? () => ComponentKit<unknown> : (setup?: P) => ComponentKit<unknown>



export const template = JSXComponent; // TODO: Temporary




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

export function makeComponent(
   Component: ComponentTag,
   Slot: InferSlot | undefined,
   fromTag: ComponentConfig,
   // $index: Ion<number> | undefined
): ComponentKit {
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
   const publicComponent = output.as
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




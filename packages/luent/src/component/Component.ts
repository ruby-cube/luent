import { AnyObject } from "@rue/types";
import { ComponentConfig, RawJSXNode } from "../node/makeJSXNode";
import { isObject, normalizeToArray } from "@rue/utils";
import { initializeRef, InternalRef, isNodesRef } from "../node/NodeRef";
import { toInput } from "./x-Input";
import { JSXNode, mountDOMNodes, processJSXOutput, setUpNodeVine, VineNode } from "../node/VineNode";
import { NodeRefsConfig, setUpNodeRefs } from "../node/NodeRefs";
import { setUpHooks } from "../flask/template-hooks";
import { JSXComponent } from "@rue/ruescript";
import type { ComponentKit } from "@rue/ruescript";
import { composeHooks, composeRef, toSetup } from "./bindings";
import { nestAttributes } from "./bindings-nested";
import { atMount, atMounted } from "../flask/flask-hooks";


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
): ComponentKit<unknown> {
   const setup = toSetup(fromTag)
   const output = Component(setup) // TODO: handle forwarded named slots
   console.log('makeComponent', output)
   if (output instanceof Promise)
      throw new Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup")
   const publicComponent = output.as

   if (publicComponent) {
      const ref = composeRef(setup) // throw if ref already used
      if (ref) {
         if (isObject(ref) && 'arr' in ref) {
            setUpNodeRefs(publicComponent, ref.arr, normalizeToArray(ref.i))
         }
         else {
            initializeRef(ref, publicComponent)
         }
      }
   }

   const hooks = composeHooks(setup)
   if (hooks) {
      setUpHooks(publicComponent, hooks)
   }

   if (setup['nested-bind']) {
      const nodes = output.nodes = processJSXOutput(output.nodes)
      const fragment = new DocumentFragment()
      mountDOMNodes(nodes!, fragment)
      nestAttributes(fragment, normalizeToArray(setup['nested-bind']))

   }
   // TODO: if publicComponent and hooks has been nested, throw error?

   // if (tag['show-if']) setUpConditionalDisplay()
   return output
}




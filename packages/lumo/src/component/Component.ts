import { AnyObject } from "@rue/types";
import { ComponentConfig, RawJSXNode } from "../node/makeJSXNode";
import { INTERNAL, Ion, toValue } from "@rue/quarky";
import { isObject, normalizeToArray } from "@rue/utils";
import { $Node, $Nodes, initializeListRef, initializeRef, InternalRef, isNodesRef } from "../node/NodeRef";
import { toInput } from "./Input";
import { JSXNode } from "../node/VineNode";
import { NodeRefsConfig, setUpNodeRefs } from "../node/NodeRefs";
import { Style } from "./Style";
import { analyzeAttributes } from "../element/makeElement";
import { setUpHooks } from "../flask/template-hooks";




// export type Slot = JSXNode
export type ComponentSetup<P extends never | AnyObject = never | AnyObject> = P extends never ? () => Component : (setup?: P) => Component

export const COMPONENT = Symbol('publicComponent')
export type PublicComponent<T extends AnyObject = AnyObject> = T // contains anything in expose



export interface Component<T extends AnyObject | undefined = AnyObject | undefined> {
   exposed: T extends AnyObject ? PublicComponent<T> : undefined;
   jsxNodes: RawJSXNode[];
   // morphicRenderKit?: PolymorphKit
}

type JSXTemplate = RawJSXNode

// TODO: accept a third paramenter for mountTeleported
// compiler macro to transform jsx template into render function
export function template(template: JSXTemplate) {
   const jsxNodes = normalizeToArray(toValue(template ? unnestComponent(template) : undefined)) as RawJSXNode[]
   function ref<T extends AnyObject | undefined = AnyObject | undefined>(component: T) {
      return {
         exposed: component,
         jsxNodes
      }
   }
   return {
      exposed: undefined, // TODO: make read only
      jsxNodes,
      ref,
      css: (strings: TemplateStringsArray, ...values: any[]) => {
         Style(strings, ...values)
         return {
            exposed: undefined,
            jsxNodes,
            ref
         }
      }
   }

}







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



export type InferSlot<T extends ComponentSetup = ComponentSetup> =
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
   Component: ComponentSetup,
   Slot: InferSlot | undefined,
   tag: ComponentConfig,
   // $index: Ion<number> | undefined
): Component {
   const { ref, ...other } = tag
   const {hooks} = analyzeAttributes(other)
   // TODO: component flask lifecycle hooks
   tag.Slot = Slot;
   const output = Component(toInput(tag))
   if (output instanceof Promise)
      throw new Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup")
   const publicComponent = output.exposed ?? {}
   if (ref) {
      if (isObject(ref) && 'arr' in ref) {
         setUpNodeRefs(publicComponent, ref.arr, normalizeToArray(ref.i))
      }
      else {
         initializeRef(ref, publicComponent)
      }
   }
   setUpHooks(publicComponent, hooks)

   // if (tag['display-if']) setUpConditionalDisplay()
   return output
}




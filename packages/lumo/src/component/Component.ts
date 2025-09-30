import { AnyObject } from "@rue/types";
import { ComponentConfig, RawJSXNode } from "../node/makeJSXNode";
import { Ion, toValue } from "@rue/quarky";
import { isObject, normalizeToArray } from "@rue/utils";
import { $Node, $Nodes, initializeListRef, initializeRef, InternalRef, isNodesRef } from "../node/NodeRef";
import { toInput } from "./Input";
import { JSXNode } from "../node/VineNode";




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

//TODO: accept a third paramenter for mountTeleported
// compiler macro to transform jsx template into render function
export function component<T extends AnyObject | undefined = AnyObject | undefined>(exposedComponent: T, template: JSXTemplate): Component<T>
export function component<T extends AnyObject | undefined = AnyObject | undefined>(template: JSXTemplate): Component<undefined>
export function component<T extends AnyObject | undefined = AnyObject | undefined>(templateOrComponent: T | JSXTemplate, template?: JSXTemplate): Component<T extends AnyObject ? T : undefined> {
   const jsxNodes = arguments.length === 2 ? template : templateOrComponent as JSXTemplate;
   const exposed = arguments.length === 2 ? templateOrComponent as AnyObject : undefined;
   return {
      exposed, //TODO: make read only
      jsxNodes: normalizeToArray(toValue(jsxNodes ? unnestComponent(jsxNodes) : undefined)),
   } as Component<T extends AnyObject ? T : undefined>
}






export function initializeComponentRef(
   ref: $Node | $Nodes,
   publicComponent: PublicComponent,
   $index: Ion<number> | undefined,
) {
   if (isNodesRef(ref)) {
      initializeListRef(ref, publicComponent, $index!)
   }
   else {
      initializeRef(<InternalRef<$Node>>ref, publicComponent)
   }
}

function __DEV__leakProof(exposed: AnyObject) {
   //TODO: make sure everything has creationScopeID
}

function __DEV__assertInCreationScope(object: AnyObject) {
   //TODO: assert that object is within its creation scope
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
   $index: Ion<number> | undefined
): Component {
   //TODO: component flask lifecycle hooks
   tag.Slot = Slot;
   const output = Component(toInput(tag))
   if (output instanceof Promise)
      throw new Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup")
   if (tag.ref) initializeComponentRef(tag.ref, output.exposed ?? {}, $index)
      // if (tag['show-if']) setUpConditionalDisplay()
   return output
}

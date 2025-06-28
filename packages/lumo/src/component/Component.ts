import { AnyObject } from "@rue/types";
import { JSXNode, RawJSXNode } from "../node/makeNode";
import { Ion, toValue } from "@rue/quarky";
import { isObject, normalizeToArray } from "@rue/utils";
import { initializeListRef, initializeRef, NodeRef, NodesRef } from "../node/NodeRef";



export type DOMNode = CharacterData | Element
// export type Props = {
//     [key: string]: any;
//     Slot?: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
// }

export type Slot<P = undefined> =
   P extends undefined ? (() => JSXNode) | JSXNode
   : (props: P) => JSXNode


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


export function exposeComponent(
   publicComponent: AnyObject,
   ref: NodeRef,
   $index: Ion<number> | undefined
) {
   initializeComponentRef(ref, publicComponent || {}, $index)
}



export function initializeComponentRef(
   ref: NodeRef | NodesRef,
   publicComponent: PublicComponent,
   $index: Ion<number> | undefined,
) {
   if ($index) {
      initializeListRef(<NodesRef>ref, publicComponent, $index)
   }
   else {
      console.log('initialize component ref', publicComponent)
      initializeRef(ref, publicComponent)
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

export function isComponentKit(entity: unknown): entity is Component{
   return isObject(entity) && 'exposed' in entity && 'jsxNodes' in entity
}

// function normalizeToFragmentArray(entity: any) { // distinguish conditional series from 
//    if (entity instanceof ConditionalRenderKit) return [[entity]];
//    if (entity instanceof Array) { // check if conditional series
//       if (entity[0] instanceof ConditionalRenderKit) return [entity];
//       return entity;
//    }
//    return normalizeToArray(entity);
// }
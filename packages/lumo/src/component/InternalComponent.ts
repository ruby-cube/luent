import { AnyObject } from "@rue/types";
import { NodeEntity } from "../node/makeNode";
import { _NodePod } from "../node/NodePod";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { AtomicIon, isAtomicIon, rein, toValue } from "@rue/quarky";
import { NodeKit, setUpNodeEntities } from "../node/setUpNodeEntities";
import { isFunction, normalizeToArray } from "@rue/utils";
import { initializeListRef, initializeRef, NodeRef, NodesRef } from "../node/NodeRef";
import exp from "constants";



export type DOMNode = CharacterData | Element
// export type Props = {
//     [key: string]: any;
//     Slot?: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
// }

export type Slot<P = undefined> =
   P extends undefined ? (() => NodeEntity) | NodeEntity
   : (props: P) => NodeEntity


// export type Slot = NodeEntity
export type ComponentSetup<P extends never | AnyObject = never | AnyObject> = P extends never ? () => Component : (setup?: P) => Component

export const COMPONENT = Symbol('publicComponent')
export type PublicComponent<T extends AnyObject = AnyObject> = T // contains anything in expose



export interface Component<T extends AnyObject | undefined = AnyObject | undefined> {
   exposedComponent?: T extends AnyObject ? PublicComponent<T> : undefined;
   renderedTemplate: NodeEntity;
   // morphicRenderKit?: MorphicRenderKit
}

// export function expose<T>(publicComponent: T & Object): T {
//    return rein(publicComponent);
// }

type JSXTemplate = NodeEntity

//TODO: accept a third paramenter for mountTeleported
// compiler macro to transform jsx template into render function
export function component<T extends AnyObject | undefined = AnyObject | undefined>(exposedComponent: T, template: JSXTemplate): Component<T>
export function component<T extends AnyObject | undefined = AnyObject | undefined>(template: JSXTemplate): Component<undefined>
export function component<T extends AnyObject | undefined = AnyObject | undefined>(templateOrComponent: T | JSXTemplate, template?: JSXTemplate): Component<T extends AnyObject ? T : undefined> {
   const renderedTemplate = arguments.length === 2 ? template : templateOrComponent as JSXTemplate;
   const exposedComponent = arguments.length === 2 ? templateOrComponent as AnyObject : undefined;
   return {
      exposedComponent: rein(exposedComponent),
      renderedTemplate: toValue(renderedTemplate ? unnestComponent(renderedTemplate) : undefined),
   } as Component<T extends AnyObject ? T : undefined>
}

export class InternalComponent {
   nodeEntities: NodeEntity[] | null = null; // these are *initial* node entities. Node pods contain current nodes //TODO: add context type?? //QUESTION: should this be cleared or updated?
   exposed: AnyObject | undefined;
   nodeKits?: NodeKit[]

   constructor(
      component: Component,
      ref: NodeRef | undefined,
      $index: AtomicIon<number> | undefined
   ) {
      const exposed = this.exposed = component.exposedComponent;
      if (ref) initializeComponentRef(ref, exposed || {}, $index)
      this.nodeEntities = normalizeToArray(component.renderedTemplate)
   }

   mount(
      parent: Element,
      fragment?: DocumentFragment,
   ) { //TODO: what if a component's root elements is conditional or a dynamic list??
      const nodeEntities = this.nodeKits!;
      if (!(parent instanceof Element))
         throw new Error("Parent cannot be a text node")
      mountNodeEntities(nodeEntities, parent, fragment)
   }

   setUp(
      parent: Element,
      nodePod: _NodePod
   ) {
      this.nodeKits = setUpNodeEntities(this.nodeEntities!, parent, nodePod)
      return this;
   }
}


export function initializeComponentRef(
   ref: NodeRef | NodesRef,
   publicComponent: PublicComponent,
   $index: AtomicIon<number> | undefined,
) {
   if (!isAtomicIon(ref)) throw new Error("INVALID INPUT: Must use NodeRef or NodesRef ion as ref")
   if ($index) {
      initializeListRef(<NodesRef>ref, publicComponent, $index)
   }
   else {
      initializeRef(ref, publicComponent)
   }
}

export function unnestComponent(nodeEntities: NodeEntity) {
   const isArray = nodeEntities instanceof Array;
   if (isArray && nodeEntities.length > 1) return nodeEntities;
   const entity = isArray ? nodeEntities[0] : nodeEntities;
   if (entity instanceof InternalComponent) {
      if (entity.exposed)
         return nodeEntities;
      return entity.nodeEntities;
   }
   return nodeEntities
}

// function normalizeToFragmentArray(entity: any) { // distinguish conditional series from 
//    if (entity instanceof ConditionalRenderKit) return [[entity]];
//    if (entity instanceof Array) { // check if conditional series
//       if (entity[0] instanceof ConditionalRenderKit) return [entity];
//       return entity;
//    }
//    return normalizeToArray(entity);
// }
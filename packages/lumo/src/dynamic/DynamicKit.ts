import { isObject } from "@rue/utils";
import { RenderFunction, withGroupActivationReset } from "../node/makeNode";
import {  NodeEntity, processJSXOutput } from "../node/setUpNodeEntities";
import { DynamicPod, NodePod } from "../node/NodePod";
import { getClosestCommons } from "../commons/commons-stack";
import { Provided, callWithCommons } from "../commons/Commons";
import { Flask } from "@rue/flask";
import { TransitionNode } from "../transition/TransitionNode";
import { AnyObject } from "@rue/types";





export type RenderTransient = (parent: Element, nodePod: NodePod) => NodeEntity[]

export function toRenderTransient(renderConditional: RenderFunction, provide: Provided): RenderTransient {
   const parentCommons = getClosestCommons()
   if (!parentCommons) throw new Error('commons missing')
   return (parent: Element, nodePod: NodePod, input?: Object) =>
      processJSXOutput(callWithCommons(() => withGroupActivationReset(() => renderConditional(input)), provide, parentCommons), parent, nodePod)
}

export interface DynamicKit {
   // store contextual state
   context: Map<string | symbol, any>;
   outerFlask: Flask
   phasicNode: TransitionNode | null

   dynamicPod: DynamicPod
   __DEV__asyncPath: string | undefined

   mount(parent: Element, fragment?: DocumentFragment): void
   setUp(parent: Element): DynamicKit
}

export function isDynamicKit(value: unknown): value is DynamicKit {
   return isObject(value) && 'dynamicPod' in value && 'setUp' in value;
}

type ConditionalKit = {
   nodePod: NodePod;
   flask: Flask | undefined;
   renderConditional: (parent: Element, nodePod: NodePod) => any[];
   transitionNodes: TransitionNode[];
}

export interface ConditionalSeriesKit extends DynamicKit {
   render(kit: ConditionalKit & AnyObject, parent: Element, fragment?: DocumentFragment): void
   deactivateConditional(id: any): void
   activateConditional(id: any, parent: Element, fragment?: DocumentFragment): void
}

export function wrapToPreserve(renderConditional: (parent: Element, nodePod: NodePod) => NodeEntity[]) {
   let nodeEntities: NodeEntity[];
   return (parent: Element, nodePod: NodePod) => {
      if (nodeEntities) return nodeEntities;
      return nodeEntities = renderConditional(parent, nodePod)
   }
}


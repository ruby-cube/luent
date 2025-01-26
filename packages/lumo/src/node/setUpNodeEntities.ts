import { isObjectLiteral } from "@rue/utils";
import { DOMNode, InternalComponent } from "../component/InternalComponent";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { MatchCaseKit } from "../conditional/MatchCaseKit";
import { setUpElement } from "../element/mountElement";
import { ListRenderKit } from "../iteratives/ListRenderKit";
import { MorphicRenderKit } from "../morphic/MorphicNode";
import { NodeEntity, SwapConfig, SwapType } from "./makeNode";
import { setUpTextNode } from "./mountTextNode";
import { InnerHTMLKit, isInnerHTMLKit, setUpInnerHTML } from "./mountInnerHTML";
import { getClosestCommons } from "../commons/commons-stack";
import { NodePod } from "./NodePod";

// [ ] validate and apply swap tag
// [ ] validate and compose conditional series
// [V] spread arrays and nested array

export type NodeKit = DOMNode | InternalComponent | ListRenderKit | ConditionalRenderSeries | MorphicRenderKit | InnerHTMLKit

type HTMLString = string;

export function setUpNodeEntities(
   nodeEntities: NodeEntity[],
   parent: Element, //TODO: parent is as optional as fragment I think...
   nodePod: NodePod,
   nodeKits: NodeKit[] = []
) {
   const series = new ConditionalSeriesBuilder(parent, nodePod, nodeKits)

   for (let i = 0; i < nodeEntities.length; i++) {
      let nodeEntity = nodeEntities[i];
      if (nodeEntity instanceof Array) {
         if (series.isOpen) series.close()
         setUpNodeEntities(nodeEntities, parent, nodePod, nodeKits) //QUESTION: should swap and conditionalArray be inherited by this setup scope?
      }
      else if (nodeEntity instanceof ConditionalRenderKit) {
         const statementType = nodeEntity.statementType
         if (statementType === 'if') {
            series.open(nodeEntity)
         }
         else if (statementType === 'elseIf') {
            if (series.isOpen) series.add(nodeEntity)
            else if (__DEV__) console.warn('extraneous ElseIf()')
         }
         else { //else 
            if (series.isOpen) {
               series.add(nodeEntity)
               series.close()
            }
            else if (__DEV__) console.warn('extraneous Else()')
         }
      }
      else if (nodeEntity instanceof SwapConfig) {
         const nextEntity = nodeEntities[i + 1];
         if (nextEntity instanceof ConditionalRenderKit && nextEntity.statementType === 'if') {
            series.open(nodeEntity.swap)
         }
         else if (nextEntity instanceof MatchCaseKit) {
            nextEntity.swap = nodeEntity.swap
         }
         else if (__DEV__) {
            console.warn('extraneous swap tag')
         }
      }
      else if (nodeEntity === undefined) {
         // if (series.isOpen) series.close()
         continue;
      }
      else if (isInnerHTMLKit(nodeEntity)) {
         nodeKits.push(setUpInnerHTML(nodeEntity, parent))
      }
      else {
         if (series.isOpen) series.close()
         nodeKits.push(setUpNodeEntity(nodeEntity, parent, nodePod))
      }
   }
   if (series.isOpen) series.close()
   return nodeKits;
}

// function closeConditionalSeries(conditionalArray: ConditionalRenderKit[], swap: 'mount' | 'display' | 'instance' | undefined, parent: Element, nodeVine: NodePod, nodeKits: NodeKit[]) {
//    const series = createConditionalSeries(conditionalArray, swap)
//    conditionalArray = null
//    swap = undefined;
//    nodeKits.push(setUpNodeEntity(series, parent, nodeVine));
// }

class ConditionalSeriesBuilder {
   private conditionalArray: ConditionalRenderKit[] | null = null;
   private swap: SwapType | undefined;

   constructor(
      private parent: Element,
      private nodePod: NodePod,
      private nodeKits: NodeKit[],
   ) {

   }

   get isOpen() {
      return !!this.conditionalArray && this.conditionalArray.length > 0
   }

   open(
      kitOrSwap: ConditionalRenderKit | SwapType
   ) {
      if (this.isOpen) {
         // complete previous conditional array
         this.close()
      }
      const isSwap = typeof kitOrSwap === 'string'
      this.conditionalArray = isSwap ? [] : [kitOrSwap]
      this.swap = isSwap ? kitOrSwap : undefined;
   }

   add(kit: ConditionalRenderKit) {
      if (!this.conditionalArray) throw new Error('no open series')
      this.conditionalArray?.push(kit)
   }

   close() {
      const series = this.conditionalArray && this.conditionalArray.length ?
         new ConditionalRenderSeries(
            this.conditionalArray!,
            makeElseKit,
            this.swap
         ) : undefined
      this.conditionalArray = null
      this.swap = undefined;
      if (series) this.nodeKits.push(setUpNodeEntity(series, this.parent, this.nodePod));
   }
}

function makeElseKit() {
   return new ConditionalRenderKit('else', () => [], 'create', [])
}


export function setUpNodeEntity(
   nodeEntity: NodeEntity,
   parent: Element, //TODO: parent is as optional as fragment I think...
   nodePod: NodePod,
) {
   if (nodeEntity instanceof Element) { // Element type from Web API
      return setUpElement(nodeEntity, nodePod)
   }
   if (
      nodeEntity instanceof InternalComponent
      || nodeEntity instanceof ConditionalRenderSeries
      || nodeEntity instanceof ListRenderKit
      || nodeEntity instanceof MorphicRenderKit
   ) {
      return nodeEntity.setUp(parent, nodePod);
   }
   return setUpTextNode(nodeEntity, nodePod)
}
import { DOMNode, InternalComponent } from "../component/InternalComponent";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { MatchCaseKit } from "../conditional/MatchCaseKit";
import { getContext } from "../context/context-stack";
import { setUpElement } from "../element/mountElement";
import { ListRenderKit } from "../iteratives/ListRenderKit";
import { MorphicRenderKit } from "../morphic/MorphicNode";
import { NodeEntity, SwapConfig } from "./makeNode";
import { setUpTextNode } from "./mountTextNode";
import { _NodePod } from "./NodePod";

// [ ] validate and apply swap tag
// [ ] validate and compose conditional series
// [V] spread arrays and nested array

export type NodeKit = DOMNode | InternalComponent | ListRenderKit | ConditionalRenderSeries | MorphicRenderKit


let swap: undefined | 'mount' | 'display' | 'instance';
let conditionalArray: null | ConditionalRenderKit[] = null;

export function setUpNodeEntities(
   nodeEntities: NodeEntity[],
   parent: Element, //TODO: parent is as optional as fragment I think...
   nodePod: _NodePod,
   nodeKits: NodeKit[] = []
) {
   console.log('nodeEntities', nodeEntities)
   for (let i = 0; i < nodeEntities.length; i++) {
      let nodeEntity = nodeEntities[i];
      if (nodeEntity instanceof Array) {
         setUpNodeEntities(nodeEntities, parent, nodePod, nodeKits)
      }
      else if (nodeEntity instanceof ConditionalRenderKit) {
         const statementType = nodeEntity.statementType
         if (statementType === 'if') {
            if (conditionalArray) {
               const series = createConditionalSeries()
               nodeKits.push(setUpNodeEntity(series, parent, nodePod));
               conditionalArray = null
            }
            conditionalArray = [nodeEntity]
         }
         else if (statementType === 'elseIf') {
            if (conditionalArray) conditionalArray.push(nodeEntity)
            else if (__DEV__) console.warn('extraneous ElseIf()')
         }
         else {
            if (conditionalArray) {
               conditionalArray.push(nodeEntity);
               const series = createConditionalSeries()
               nodeKits.push(setUpNodeEntity(series, parent, nodePod))
               conditionalArray = null
            }
            else if (__DEV__) console.warn('extraneous Else()')
         }
      }
      else if (nodeEntity instanceof SwapConfig) {
         const nextEntity = nodeEntities[i + 1];
         if (nextEntity instanceof ConditionalRenderKit && nextEntity.statementType === 'if') {
            swap = nodeEntity.swap;
         }
         else if (nextEntity instanceof MatchCaseKit) {
            nextEntity.swap = nodeEntity.swap
         }
         else if (__DEV__) {
            console.warn('extraneous swap tag')
         }
      }
      else if (nodeEntity === undefined) {
         continue;
      }
      else {
         nodeKits.push(setUpNodeEntity(nodeEntity, parent, nodePod))
      }
   }
   return nodeKits;
}

function createConditionalSeries() {
   const series = new ConditionalRenderSeries(
      conditionalArray!,
      makeElseKit,
      swap
   )
   swap = undefined;
   return series;
}

function makeElseKit() {
   return new ConditionalRenderKit('else', () => [], 'create', getContext(), [])
}


export function setUpNodeEntity(
   nodeEntity: NodeEntity,
   parent: Element, //TODO: parent is as optional as fragment I think...
   nodePod: _NodePod,
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
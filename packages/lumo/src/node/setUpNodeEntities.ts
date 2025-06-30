import { isObjectLiteral, normalizeToArray } from "@rue/utils";
import { Component, DOMNode, isComponentKit } from "../component/Component";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { MatchCaseKit } from "../conditional/MatchCaseKit";
import { ListRenderKit } from "../iteratives/ListRenderKit";
import { getGroupActivationType, JSXNode, RawJSXNode } from "./makeNode";
import { createTextNode, setUpTextNode } from "./TextNode";
import { InnerHTMLKit, isInnerHTMLKit, setUpInnerHTML } from "./InnerHTML";
import { NodePod } from "./NodePod";
import { AnyObject } from "@rue/types";
import { PolymorphKit } from "../conditional/Polymorph";
import { ActivationType } from "../conditional/If";
import { jsx } from "@rue/jsx-runtime";
import { DynamicKit, isDynamicKit } from "../dynamic/DynamicKit";
import { isPortal } from "../boundaries/Portal";

// [ ] validate and apply swap tag
// [ ] validate and compose conditional series
// [V] spread arrays and nested array

export type NodeEntity = DOMNode | DynamicKit

export type MutableKit = { mu: AnyObject }

/**
 * - spread arrays and components into root array
 * - get rid of undefined
 * @param jsxNodes 
 */
export function flattenJSXOutput(jsxNodes: RawJSXNode[], flattened: JSXNode[] = []) {
   for (const jsxNode of jsxNodes) {
      if (jsxNode instanceof Array) {
         flattenJSXOutput(jsxNode, flattened)
      }
      else if (isComponentKit(jsxNode)) {
         flattenJSXOutput(jsxNode.jsxNodes, flattened)
      }
      else if (jsxNode === undefined) {
         continue;
      }
      else {
         flattened.push(jsxNode)
      }
   }
   return flattened;
}


type HTMLString = string;
/**
 * 
 * - turns raw jsx nodes into DOMNode and NodeEntities
 * - set up watchers
 * 
 * @param jsxNodes 
 * @param parent 
 * @param nodePod 
 * @param nodeKits 
 * @returns 
 */
export function setUpNodeEntities(
   jsxNodes: JSXNode[],
   parent: Element,
   nodePod: NodePod,
   nodeEntities: NodeEntity[] = []
) {
   for (let i = 0; i < jsxNodes.length; i++) {
      let jsxNode = jsxNodes[i];
      if (isInnerHTMLKit(jsxNode)) throw new Error('innerHTML cannot have sibling nodes')
      nodeEntities.push(setUpNodeEntity(jsxNode, parent, nodePod))
   }
   return nodeEntities;
}

// function closeConditionalSeries(conditionalArray: ConditionalRenderKit[], swap: 'mount' | 'display' | 'instance' | undefined, parent: Element, nodeVine: NodePod, nodeKits: NodeEntity[]) {
//    const series = createConditionalSeries(conditionalArray, swap)
//    conditionalArray = null
//    swap = undefined;
//    nodeKits.push(setUpNodeEntity(series, parent, nodeVine));
// }

// class ConditionalSeriesBuilder {
//    private conditionalArray: ConditionalRenderKit[] | null = null;

//    constructor(
//       private parent: Element,
//       private nodePod: NodePod,
//       private nodeKits: NodeEntity[],
//    ) {

//    }

//    get isOpen() {
//       return !!this.conditionalArray && this.conditionalArray.length > 0
//    }

//    open(
//       kit: ConditionalRenderKit
//    ) {
//       if (this.isOpen) {
//          // complete previous conditional array
//          this.close()
//       }
//       this.conditionalArray =  [kit]
//    }

//    add(kit: ConditionalRenderKit) {
//       if (!this.conditionalArray) throw new Error('no open series')
//       this.conditionalArray?.push(kit)
//    }

//    close() {
//       const series = this.conditionalArray && this.conditionalArray.length ?
//          new ConditionalRenderSeries(
//             this.conditionalArray!,
//             makeElseKit,
//             getGroupActivationType()
//          ) : undefined
//       this.conditionalArray = null
//       if (series) this.nodeKits.push(setUpNodeEntity(series, this.parent, this.nodePod));
//    }
// }




export function setUpNodeEntity(
   jsxNode: Exclude<JSXNode, InnerHTMLKit | Component>,
   parent: Element,
   nodePod: NodePod,
) {
   if (jsxNode instanceof Element) { // Element type from Web API
      nodePod.push(jsxNode)
      return jsxNode;
   }
   if (isDynamicKit(jsxNode)) {
      nodePod.push(jsxNode.dynamicPod)
      return jsxNode.setUp(parent);
   }
   if (isPortal(jsxNode)){
      return jsxNode;
   }
   const textNode = createTextNode(jsxNode)
   setUpTextNode(jsxNode, textNode)
   nodePod.push(textNode)
   return textNode
}

export function processJSXOutput(output: RawJSXNode, parent: Element, nodePod: NodePod) {
   return setUpNodeEntities(flattenJSXOutput(normalizeToArray(output)), parent, nodePod)
}
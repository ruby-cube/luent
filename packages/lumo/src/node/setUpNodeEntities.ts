import { isObjectLiteral } from "@rue/utils";
import { DOMNode, InternalComponent } from "../component/InternalComponent";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { MatchCaseKit } from "../conditional/MatchCaseKit";
import { ListRenderKit } from "../iteratives/ListRenderKit";
import { getGroupActivationType, NodeEntity } from "./makeNode";
import { setUpTextNode } from "./TextNode";
import { InnerHTMLKit, isInnerHTMLKit, setUpInnerHTML } from "./InnerHTML";
import { NodePod } from "./NodePod";
import { AnyObject } from "@rue/types";
import { PolymorphKit } from "../conditional/Polymorph";
import { ActivationType } from "../conditional/If";

// [ ] validate and apply swap tag
// [ ] validate and compose conditional series
// [V] spread arrays and nested array

export type NodeKit = DOMNode | InternalComponent | ListRenderKit | ConditionalRenderSeries | PolymorphKit | InnerHTMLKit

export type MutableKit = { mu: AnyObject }

type HTMLString = string;

export function setUpNodeEntities(
   nodeEntities: NodeEntity[],
   parent: Element, //TODO: parent is as optional as fragment I think...
   nodePod: NodePod,
   nodeKits: NodeKit[] = []
) {
   for (let i = 0; i < nodeEntities.length; i++) {
      let nodeEntity = nodeEntities[i];
      if (nodeEntity instanceof Array) {
         setUpNodeEntities(nodeEntity, parent, nodePod, nodeKits) //QUESTION: should swap and conditionalArray be inherited by this setup scope?
      }
      // else if (nodeEntity instanceof ConditionalRenderKit) {
      //    nodeKits.push(setUpNodeEntity(new ConditionalRenderSeries([nodeEntity], getGroupActivationType()), parent, nodePod))
      // }
      else if (nodeEntity === undefined) {
         continue;
      }
      else if (isInnerHTMLKit(nodeEntity)) {
         nodeKits.push(setUpInnerHTML(nodeEntity, parent))
      }
      else {
         nodeKits.push(setUpNodeEntity(nodeEntity, parent, nodePod))
      }
   }
   return nodeKits;
}

// function closeConditionalSeries(conditionalArray: ConditionalRenderKit[], swap: 'mount' | 'display' | 'instance' | undefined, parent: Element, nodeVine: NodePod, nodeKits: NodeKit[]) {
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
//       private nodeKits: NodeKit[],
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
   nodeEntity: NodeEntity,
   parent: Element, //TODO: parent is as optional as fragment I think...
   nodePod: NodePod,
) {
   if (nodeEntity instanceof Element) { // Element type from Web API
      nodePod.push(nodeEntity)
      return nodeEntity;
   }
   if (
      nodeEntity instanceof InternalComponent
      || nodeEntity instanceof ConditionalRenderSeries
      || nodeEntity instanceof ListRenderKit
      || nodeEntity instanceof PolymorphKit
   ) {
      return nodeEntity.setUp(parent, nodePod);
   }
   return setUpTextNode(nodeEntity, nodePod)
}
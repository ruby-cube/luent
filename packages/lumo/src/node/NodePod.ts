import { EffectFlask } from "@rue/flask";
import { DOMNode, InternalComponent } from "../component/InternalComponent";
import { NodeRef } from "./NodeRef";

// Node Pods represent groups of nodes created by `For` and `If`.
// 
// A root node pod represents the child nodes NodeList of a parent DOMNode or the nodes of a dynamic node (which may be removed from or inserted into the view tree), NOT the root node(s) of a component.
// They are ignorant of component boundaries and care only about:
// - distinguishing static nodes from dynamic pods
// - the boundary between parent and child in the DOM (given that a root node pod represents a child nodes NodeList)
// - distinguishing dynamic nodes within a dynamic node pod.
// 
// The main purpose of node pods is to aid in node insertions when updates are triggered by dynamic `For` and `If`
// _DynamicNodePod supports in emitting Update and Unmounted hooks by collecting components in the `activeComponents` property
// For Unmounting: activeComponents should collect the highest component of a branch, then let the unmount cascade unmount any descendant components.
// For Updates: call emit(ON_UPDATED) for the PARENT component not the components within via getCurrentComponent();
//
// A new root node pod is created when mE is called and passed through the set up of its (child) node entities.
// The root node pod should not be passed to grand children.
//
// When setting up node entities for the first time, it doesn't matter whether you append to the DOM or append to node pods first
//
// When updating by inserting node entities, insert into the node pods first, then insert into the DOM. Must insert via forwards loop.
// When updating by removing node entities, remove from DOM first, then remove from node pods and clear active components array. Remove via backwards loop if using index.
//
// When updating by inserting node entities, a new node pod 
// (1) created
// (2) populated
// (3) batch inserted into its containing dynamic node pod
//

//
// export type _NodePod = (DOMNode | _DynamicNodePod)[]
//
// [node, node, [[node, [node]], [node, [node]]]]

export type NodePod = ReadonlyArray<DOMNode | DynamicNodePod>
// & {index?: number, prevNode: ()=> DOMNode | null}



// Node pods contain the children of an element,the nodes of a component, or a grouping within a dynamic node pod (for lists and conditionals)
export class _NodePod extends Array<DOMNode | _DynamicNodePod> {
   index?: number;
   pod?: _DynamicNodePod;
   // componentsToUnmount: InternalComponent[] = [];
   refs: NodeRef[] = [];

   active: boolean = true; // for 'mount' activation types

   // flask?: EffectFlask // for dynamic lists to dispose of effects

   // setFlask(flask: EffectFlask) {
   //     this.flask = flask;
   // }

   constructor(pod?: _DynamicNodePod, index?: number) {
      super();
      this.index = index;
      this.pod = pod;
   }

   // get prevNode(): DOMNode | null {
   //    if (this.index === undefined) return null;
   //    const entity = this.pod?.[this.index - 1];
   //    if (!entity && !this.pod) return null;
   //    if (!entity) return this.pod!.prevNode
   //    return entity.lastNode;
   // }

   get lastNode(): DOMNode | null {
      const entity = super.at(- 1);
      if (!entity) return null;
      if (entity instanceof _DynamicNodePod)
         return entity.lastNode;
      return entity;
   }

   get prevActiveSibling(): _NodePod | null {
      if (this.index === 0) return null; //TODO:Should I keep looking for an active cousin?
      const sibling = this.pod?.[this.index! - 1]
      if (sibling?.active) return sibling;
      if (sibling) return sibling.prevActiveSibling
      return null;
   }
   get prevAunt(): DOMNode | _DynamicNodePod | null {
      const podIndex = this.pod?.index
      if (podIndex === undefined || this.pod?.pod === undefined) {
         return null;
      }
      const prevAunt = this.pod[podIndex]
      if (!prevAunt)
         return this.closestPrevAunt
      prevAunt
   }

   get prevNode(): DOMNode | null {
      const prevAunt = this.prevAunt
      if (!prevAunt) {
         return null;//TODO:NOT SURE ABOUT THIS should we look at siblings?
      }
      if (prevAunt instanceof _DynamicNodePod){
         const lastNode = prevAunt.lastNode;
         if (lastNode) return lastNode;
         return prevAunt.prevNode;
      }
      return prevAunt;
   }

   appendStaticNode(node: DOMNode) {
      this.push(node);
   }

   appendDynamicPod() {
      const dynamicPod = new _DynamicNodePod(this, this.length)
      this.push(dynamicPod);
      return dynamicPod;
   }

   // appendNodePod() {
   //     const nodePod = new _NodePod(this, this.length)
   //     this.push(nodePod)
   //     return nodePod;
   // }

   connect(pod: _DynamicNodePod, index: number) {
      this.index = index;
      this.pod = pod;
   }

   disconnect() {
      this.index = undefined
      this.pod = undefined
   }

   // resetComponentsToUnmount(){
   //     this.componentsToUnmount = this.pod ? [] : undefined;
   // }

   forEachNode(doTask: (node: DOMNode, index: number | undefined) => void, index?: number) {
      for (const nodeEntity of this) {
         if (nodeEntity instanceof _DynamicNodePod) {
            for (let i = 0; i < nodeEntity.length; i++) {
               const entity = nodeEntity[i];
               // if (entity instanceof _NodePod) {
               entity.forEachNode(doTask, i)
               // }
               // else {
               //     doTask(entity, i)
               // }
            }
         }
         // else if (nodeEntity instanceof _NodePod) {
         //     nodeEntity.forEachNode(doTask, index)
         // }
         else {
            doTask(nodeEntity, index)
         }
      }
   }
}

export const NULLISH_NODE_POD = new _NodePod()


// if (ho instanceof Node){

// }
// else {
//     ho.
// }

type DynamicNodePod = ReadonlyArray<NodePod>
// & Omit<_NodePod, 'appendNodePod'>

export class _DynamicNodePod extends Array<_NodePod> {
   index: number;
   pod: _NodePod;
   // private _activeComponents: InternalComponent[] = []

   constructor(pod: _NodePod, index: number) {
      super();
      this.index = index;
      this.pod = pod;
   }

   appendNodePod() {
      const nodePod = new _NodePod(this, super.length);
      super.push(nodePod)
      return nodePod;
   }

   get prevActiveAunt(): _NodePod | null {
      const podIndex = this.pod.index
      if (podIndex === undefined || this.pod.pod === undefined) {
         return null;
      }
      const prevAunt = this.pod.prevActiveSibling
      if (!prevAunt)
         return null; //TODO: keep searching until no more
      return prevAunt
   }

   get lastActiveNodePod(): _NodePod | null {
      let index = this.length;
      while (index--) {
         const lastNodePod = this[index];
         if (!lastNodePod) return null;
         if (lastNodePod.active)
            return lastNodePod;
      }
      return null;
   }

   get prevNode(): DOMNode | null {
      const prevSib = this.pod[this.index - 1];
      if (!prevSib) {
         const prevAunt = this.prevActiveAunt
         if (prevAunt){
            const lastNode = prevAunt.lastNode
            if (lastNode) return lastNode;
            return prevAunt.prevNode
         }
         return this.prevActiveAunt?.lastNode || null;  //TODO: fix... I need to keep searching until prevNode found.. use while loop?
      };
      if (prevSib instanceof _DynamicNodePod) {
         const lastNode = prevSib.lastNode;
         if (lastNode) return lastNode;
         return prevSib.prevNode;
      }
      return prevSib;
   }

   get lastNode(): DOMNode | null {
      const nodePod = this.lastActiveNodePod;
      if (!nodePod) return null;
      return nodePod.lastNode;
   }

   setNodePod(index: number, nodePod: _NodePod) {
      this[index] = nodePod;
      nodePod.connect(this, index)
   }

   removeNodePods(index: number, deleteCount: number) {
      const nodePods = super.splice(index, deleteCount)
      for (const nodePod of nodePods) {
         nodePod.index = undefined;
         nodePod.pod = undefined;
         nodePod.disconnect();
      }
   }

   insertNodePods(index: number, nodePods: _NodePod[]) {
      super.splice(index, 0, ...nodePods)
      let count = 0;
      for (const nodePod of nodePods) {
         nodePod.connect(this, index + count)
         count++
      }
   }

   // includeComponent(component: InternalComponent) {
   //     this._activeComponents.push(component);
   // }

   // includeComponents(components: InternalComponent[]) {
   //     const activeComponents = this._activeComponents
   //     activeComponents.splice(activeComponents.length, 0, ...components)
   // }

   // clearComponents() {
   //     this._activeComponents = [];
   // }

   // get activeComponents() {
   //     return this._activeComponents;
   // }
}
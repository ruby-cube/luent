import { Glass } from "@rue/types";
import { DOMNode } from "../component/Component";
import { $Node, NodeRef } from "./NodeRef";

// Node Pods represent groups of nodes created by `For` and `If`.
// 
// A root node pod represents the child nodes NodeList of a parent DOMNode or the nodes of a dynamic node (which may be removed from or inserted into the view tree), NOT the root node(s) of a component.
// They are ignorant of component boundaries and care only about:
// - distinguishing static nodes from dynamic pods
// - the boundary between parent and child in the DOM (given that a root node pod represents a child nodes NodeList)
// - distinguishing dynamic nodes within a dynamic node pod.
// 
// The main purpose of node pods is to aid in node insertions when updates are triggered by dynamic `For` and `If`
// DynamicNodePod supports in emitting Update and Unmounted hooks by collecting components in the `activeComponents` property
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
// export type NodePod = (DOMNode | DynamicNodePod)[]
//
// [node, node, [[node, [node]], [node, [node]]]]

// export type NodePod = ReadonlyArray<DOMNode | DynamicNodePod>
// & {index?: number, prevNode: ()=> DOMNode | null}

type AnyNode = NodePod | DOMNode

export type DynamicPod = NodePod




// Node pods contain the children of an element,the nodes of a component, or a grouping within a dynamic node pod (for lists and conditionals)
export class NodePod extends Array<AnyNode> {
   index?: number;
   pod?: NodePod;
   refs: $Node[] = [];

   constructor(
      public active: boolean = true
   ) {
      super()
   }

   // ACTIVE STATE for mount activation types
   deactivate() {
      this.active = false;
   }
   activate() {
      this.active = true;
   }

   // MUTATION

   push(node: AnyNode) {
      if (node instanceof NodePod) {
         node.connect(this, this.length)
      }
      return super.push(node)
   }

   clear() {
      for (const node of this) {
         if (node instanceof NodePod) {
            node.disconnect()
         }
      }
      this.length = 0;
   }

   connect(pod: DynamicPod, index: number) {
      this.index = index;
      this.pod = pod;
   }

   disconnect() {
      this.index = undefined
      this.pod = undefined
   }

   remove(index: number, deleteCount: number) {
      const nodePods = super.splice(index, deleteCount)
      for (const node of nodePods) {
         if (node instanceof NodePod) node.disconnect();
      }
   }

   insert(index: number, nodePods: NodePod[]) {
      super.splice(index, 0, ...nodePods)
      let count = 0;
      for (const nodePod of nodePods) {
         nodePod.connect(this, index + count)
         count++
      }
   }

   splice(start: number, deleteCount?: number, ...rest: AnyNode[]): AnyNode[] {
      console.warn('Do not use splice on node pod. Use remove and insert methods instead')
      return super.splice(start, deleteCount, ...rest)
   }


   // TRAVERSAL


   get prev(): AnyNode | undefined {
      const prevSib = this.prevSib
      if (prevSib) return prevSib;
      return this.prevNearestAunt;
   }

   private get prevSib(): AnyNode | undefined {
      if (this.index === undefined) return undefined;
      return this.pod?.[this.index - 1]
   }

   private get prevNearestAunt(): AnyNode | undefined {
      let pod = this.pod;
      while (pod) {
         const prevAunt = pod.prevSib
         if (prevAunt) return prevAunt;
         pod = pod.pod
      }
      return undefined;
   }

   get prevNode(): DOMNode | undefined {
      let prev = this.prev;
      while (prev instanceof NodePod && (!prev.active)) {
         prev = prev.prev
      }
      return prev instanceof NodePod ?
         (prev.activeLeafTail || prev.prevNode) : prev;
   }

   private get activeLeafTail(): DOMNode | undefined {
      let tail = this.at(-1);
      while (tail instanceof NodePod && (!tail.active || !tail.length /* empty nodePods */)) {
         tail = tail.prev
      }
      if (tail instanceof NodePod)
         return tail.leafTail;
      return tail
   }

   private get leafTail(): DOMNode | undefined {
      const tail = this.at(-1)
      if (tail instanceof NodePod)
         return tail.leafTail;
      return tail
   }


   // LOOP
   forEachNode(doTask: (node: DOMNode, index: number | undefined) => void, index?: number) {
      for (const nodeEntity of this) {
         if (nodeEntity instanceof NodePod) {
            const limit = nodeEntity.length;
            for (let i = 0; i < limit; i++) {
               const entity = nodeEntity[i];
               if (entity instanceof NodePod) {
                  entity.forEachNode(doTask, i)
               }
               else {
                  doTask(entity, i)
               }
            }
         }
         else {
            doTask(nodeEntity, index)
         }
      }
   }
}

// export const NULLISH_NODE_POD = new NodePod()


// if (ho instanceof Node){

// }
// else {
//     ho.
// }

// & Omit<NodePod, 'appendNodePod'>

// export class DynamicNodePod extends Array<NodePod> implements AbstractNodePod {
//    index: number;
//    pod: NodePod;

//    constructor(pod: NodePod, index: number) {
//       super();
//       this.index = index;
//       this.pod = pod;
//    }

//    leafTail: DOMNode | undefined
//    // MUTATION
//    appendNodePod() {
//       const nodePod = new NodePod(this, super.length);
//       super.push(nodePod)
//       return nodePod;
//    }

//    setNodePod(index: number, nodePod: NodePod) {
//       this[index] = nodePod;
//       nodePod.connect(this, index)
//    }

//    removeNodePods(index: number, deleteCount: number) {
//       const nodePods = super.splice(index, deleteCount)
//       for (const nodePod of nodePods) {
//          nodePod.index = undefined;
//          nodePod.pod = undefined;
//          nodePod.disconnect();
//       }
//    }


//    insertNodePods(index: number, nodePods: NodePod[]) {
//       super.splice(index, 0, ...nodePods)
//       let count = 0;
//       for (const nodePod of nodePods) {
//          nodePod.connect(this, index + count)
//          count++
//       }
//    }

//    // TRAVERSAL

//    // get prevNode() {
//    //    const item = this.pod[this.index - 1];
//    //    if (!item) return this.pod.prevNode;
//    //    if (item instanceof DynamicNodePod) {
//    //       return item.lastNode;
//    //    }
//    //    return item;
//    // }
//    // get lastNode(): DOMNode | null {
//    //    const nodePod = super.at(- 1);
//    //    if (!nodePod) return null;
//    //    return nodePod.lastNode;
//    // }
// }

let shouldDebug = false;

export function startDebugger(){
   shouldDebug = true;
}

export function mountDOMNodes(
   // prevNode: Element | null | undefined
   pod: NodePod
   ,
   parent: Element, fragment: DocumentFragment) {
   if (shouldDebug) debugger;
   const prevNode = pod.prevNode
   console.log('&&& pod', pod)
   console.log('&&& get prevNode', prevNode)
   
   if (prevNode && prevNode === parent) {
      console.log('&&& append to parent', prevNode)
      parent.append(fragment) //for teleport
   }
   else if (prevNode) {
      console.log('&&& after prevNode', prevNode)
      prevNode.after(fragment)
   }
   else {
      console.log('&&& prepend to parent', prevNode)
      parent.prepend(fragment)
   }
}


export function removeDOMNodes(pod: NodePod) {
   pod.forEachNode(node => {
      node.remove()
   })
   pod.deactivate()
}
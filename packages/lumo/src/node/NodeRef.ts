import { Component, PublicComponent } from "../component/Component"
import { HTMLTag } from "../element/makeElement"
import { isSettingUpList, onBeforeListUpdate, onListUpdated } from "../iteratives/listStack"
import { Ion } from "@rue/quarky"
import { getActiveFlask } from "@rue/flask"

const INTERNAL = Symbol('internal')

type RefSource = HTMLTag | ((...args: any[]) => Component)

export type NodeReferent<
   T extends RefSource = RefSource
> =
   T extends HTMLTag ? HTMLElementTagNameMap[T] : //TODO: SVGs and Math elements
   T extends (...args: any[]) => infer R ?
   R extends Component<infer I> ?
   I extends PublicComponent ? I
   : undefined : undefined : undefined
/* 
* NodeRef property:
* - undefined means ref has not been set or has been removed from the DOM
* - null means component did not expose anything
*/

export type NodeRef<T extends RefSource = RefSource> = {
   node: NodeReferent<T> | undefined
   nodes: undefined
   // [INTERNAL]: MetaNodeRef;
}
export type NodesRef<T extends RefSource = RefSource> = {
   nodes: NodeReferent<T>[],
   node: undefined
   // [INTERNAL]: MetaNodeRef;
}


export function isAnyNodeRef(value: any): value is NodeRef | NodesRef {
   return value instanceof Object && 'nodes' in value && 'node' in value;
}

export function isNodesRef(value: any): value is NodesRef {
   return value instanceof Object && INTERNAL in value && value[INTERNAL] instanceof MetaNodesRef
}

type RefReturn<T extends RefSource, A> = A extends any[] ? NodesRef<T> : NodeRef<T>

export function NodeRef<
   T extends RefSource,
   A,
>(source: T, array?: A & any[]): RefReturn<T, A> {
   const NodeRef = createNodeRef(array)
   if (array) {
      const _ref = (<_NodesRef>NodeRef)[INTERNAL] as MetaNodesRef

      getActiveFlask()?.onDiscard(() => {
         _ref.setValue([]); // clear nodes
      })

      //TODO: there has to be a better way T_T
      if (isSettingUpList()) {
         onBeforeListUpdate(() => {
            _ref.prepUpdate();
         })

         onListUpdated((toFromIndices) => {
            _ref.update(toFromIndices)
         })
      }
   }
   return NodeRef as unknown as RefReturn<T, A>
}


export type _NodeRef = {
   node: any;
   nodes: undefined;
   // [INTERNAL]: MetaNodeRef
}

export type _NodesRef = {
   node: undefined;
   nodes: any[]
   [INTERNAL]: MetaNodesRef
}

// export class MetaNodeRef {

//    constructor(
//       readonly NodeRef: _NodeRef,
//       public value: unknown,
//    ) { }

//    setValue(newValue: unknown) {
//       return this.value = newValue;
//    }
// }

export function createNodeRef(
   array: any[] | undefined,
) {
   if (array) {
      const NodeRef = {
         nodes: array,
         node: undefined,
         get [INTERNAL]() {
            return metaRef;
         }
      }
      const metaRef = new MetaNodesRef(<_NodesRef>NodeRef, undefined)
      return NodeRef
   }
   const NodeRef = {
      nodes: undefined,
      node: undefined,
   }
   return NodeRef
}



export class MetaNodesRef {
   constructor(
      readonly NodeRef: _NodesRef,
      public value: unknown,
   ) {

   }

   setValue(newValue: any[]) {
      return this.value = newValue;
   }

   insertNode(node: any, index: number) {
      const pod = this.NodeRef.nodes;
      pod.splice(index, 0, node); //TODO: should this be splice?
   }

   removeNode(index: number) {
      const pod = this.NodeRef.nodes
      pod?.splice(index, 1);
   }

   assignIndex($index: Ion<number>, value: any) {
      const nodes = this.NodeRef.nodes
      nodes[$index()] = value;
   }

   prevNodes?: any[]

   prepUpdate() {
      this.prevNodes = this.NodeRef.nodes;
      this.setValue([])
   }

   update(toFromIndices: [number, number][]) {
      const prevNodes = this.prevNodes;
      if (!prevNodes) throw new Error('prevNodes were not store, must call prepUpdate before list update')
      const newNodes = this.NodeRef.nodes;
      for (const indices of toFromIndices) {
         const [to, from] = indices
         const node = prevNodes[from];
         newNodes[to] = node;
      }
      this.prevNodes = undefined;
   }
}

export function initializeListRef( // should this be initialize ref?
   ref: _NodesRef,
   value: NodeReferent | undefined,
   $index: Ion<number>
) {
   const _ref = ref[INTERNAL]
   if (value) {
      _ref.assignIndex($index, value);
   }
}

export function initializeRef(NodeRef: _NodeRef, value: any | undefined) {
   if (NodeRef.node)
      throw new Error("Node ref has already been assigned. A node ref can only be associated with a single dom node or component instance")
   if (value) {
      NodeRef.node = value;
      const flask = getActiveFlask()
      flask?.onDiscard(() => {
         NodeRef.node = undefined
      })
   }
}
import { Component, PublicComponent } from "../component/InternalComponent"
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
* o property:
* - undefined means ref has not been set or has been removed from the DOM
* - null means component did not expose anything
*/

export type NodeRef<T extends RefSource = RefSource> = (() => NodeReferent<T> | undefined)
   & {
      [INTERNAL]: MetaNodeRef;
   }
export type NodesRef<T extends RefSource = RefSource> = (() => NodeReferent<T>[])
   & {
      [INTERNAL]: MetaNodesRef;
   }

export function isAnyNodeRef(value: any): value is NodeRef | NodesRef {
   return value instanceof Object && INTERNAL in value
}

export function isNodesRef(value: any): value is NodesRef {
   return value instanceof Object && INTERNAL in value && value[INTERNAL] instanceof MetaNodesRef
}

type RefReturn<T extends RefSource, A> = A extends NodeReferent[] ? NodesRef<T> : NodeRef<T>

export function nodeRef<
T extends RefSource,
A,
>(source: T, array?: A): RefReturn<T, A>{
   const $ref = createNodeRef(array)
   if (array) {
      const _ref = $ref[INTERNAL] as MetaNodesRef

      getActiveFlask()?.onDiscard(() => {
         _ref.setValue([]); // clear nodes
      })

      if (isSettingUpList()) {
         onBeforeListUpdate(() => {
            _ref.prepUpdate();
         })

         onListUpdated((toFromIndices) => {
            _ref.update(toFromIndices)
         })
      }
   }
   return $ref as RefReturn<T, A>
}




export class MetaNodeRef {

   constructor(
      readonly o: NodeRef,
      public value: unknown,
   ) { }

   setValue(newValue: unknown) {
      return this.value = newValue;
   }
}

export function createNodeRef(
   value: unknown,
) {
   const metaRef = new MetaNodeRef(<NodeRef>$ref, value)

   function $ref() {
      return metaRef.value;
   }
   $ref[INTERNAL] = metaRef

   return $ref
}



export class MetaNodesRef {
   constructor(
      readonly o: NodesRef,
      public value: unknown,
   ) {

   }

   setValue(newValue: NodeReferent[]) {
      return this.value = newValue;
   }

   insertNode(node: NodeReferent, index: number) {
      const pod = this.o();
      pod.splice(index, 0, node); //TODO: should this be splice?
   }

   removeNode(index: number) {
      const pod = this.o()
      pod?.splice(index, 1);
   }

   assignIndex($index: Ion<number>, value: NodeReferent) {
      const nodes = this.o()
      nodes[$index()] = value;
   }

   prevNodes?: NodeReferent[]

   prepUpdate() {
      this.prevNodes = this.o();
      this.setValue([])
   }

   update(toFromIndices: [number, number][]) {
      const prevNodes = this.prevNodes;
      if (!prevNodes) throw new Error('prevNodes were not store, must call prepUpdate before list update')
      const newNodes = this.o();
      for (const indices of toFromIndices) {
         const [to, from] = indices
         const node = prevNodes[from];
         newNodes[to] = node;
      }
      this.prevNodes = undefined;
   }
}

export function initializeListRef( // should this be initialize ref?
   ref: NodesRef,
   value: NodeReferent | undefined,
   $index: Ion<number>
) {
   const _ref = ref[INTERNAL]
   if (value) {
      _ref.assignIndex($index, value);
   }
}

export function initializeRef(ref: NodeRef, value: NodeReferent | undefined) {
   if (ref())
      throw new Error("Node ref has already been assigned. A node ref can only be associated with a single dom node or component instance")
   const _ref = ref[INTERNAL]
   console.log('set ref', value)
   if (value) {
      _ref.setValue(value)
      const flask = getActiveFlask()
      flask?.onDiscard(() => {
         _ref.setValue(undefined);
      })
   }
}
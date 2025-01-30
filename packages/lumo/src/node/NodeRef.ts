import { Component, PublicComponent } from "../component/InternalComponent"
import { HTMLTag } from "../element/makeElement"
import { isSettingUpList, onBeforeListUpdate, onListUpdated } from "../iteratives/listStack"
import { AtomicIon } from "@rue/quarky"
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

   export function isAnyNodeRef(value: any): value is NodeRef | NodesRef{
      return value instanceof Object && INTERNAL in value
   }

   export function isNodesRef(value: any): value is NodesRef{
      return value instanceof Object && INTERNAL in value && value[INTERNAL] instanceof MetaNodesRef
   }


export function NodeRef<
   T extends RefSource
   = RefSource
>(source: T) {
   return createNodeRef(undefined) as NodeRef<T>;
}

export function NodesRef<T extends RefSource = RefSource>(source: T): NodesRef<T> {
   let $nodes = createNodeRef([]) as NodesRef<T>
   const _ref = $nodes[INTERNAL]

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
   return $nodes
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

   const proto = {
      [INTERNAL]: metaRef,
   }

   function $ref() {
      return metaRef.value;
   }

   Object.setPrototypeOf($ref, proto)

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

   assignIndex($index: AtomicIon<number>, value: NodeReferent) {
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
   $index: AtomicIon<number>
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
   if (value) {
      _ref.setValue(value)
      const flask = getActiveFlask()
      flask?.onDiscard(() => {
         _ref.setValue(undefined);
      })
   }
}
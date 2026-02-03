import { Component, PublicComponent } from "../component/Component"
import { HTMLTag } from "../element/makeElement"
import { isSettingUpList, onBeforeListUpdate, onListUpdated } from "../iteratives/listStack"
import { Ion } from "@rue/quarky"
import { getActiveFlask, getFlask } from "@rue/flask"
import { AnyObject } from "@rue/types"

export const INTERNAL = Symbol('internal')

type RefSource = HTMLTag | ((...args: any[]) => Component)


export type NodeReferent<
   T extends RefSource = RefSource
> =
   T extends HTMLTag ? HTMLElementTagNameMap[T] : // TODO: SVGs and Math elements
   T extends (...args: any[]) => infer R ?
   R extends Component<infer I> ?
   I extends PublicComponent ? I
   : never : never : never
/* 
* NodeRef property:
* - undefined means ref has not been set or has been removed from the DOM
* - null means component did not expose anything
*/

// export type NodeRef<T extends RefSource = RefSource> = {
//    node: NodeReferent<T> | undefined
//    nodes: undefined
//    // [INTERNAL]: MetaNodeRef;
// }
// export type NodesRef<T extends RefSource = RefSource> = {
//    nodes: NodeReferent<T>[],
//    node: undefined
//    // [INTERNAL]: MetaNodeRef;
// }



export type $Node<T extends RefSource = RefSource> = () => NodeReferent<T> | undefined

export type $Nodes<T extends RefSource = RefSource> = () => NodeReferent<T>[]

export type InternalRef<T> = T & { [INTERNAL]: T extends $Nodes ? MetaListRef : MetaRef }

/**
 * @internal
*/
export function isAnyNodeRef(value: any): value is InternalRef<$Node | $Nodes> {
   return value instanceof Object && INTERNAL in value
}

/**
 * @internal
*/
export function isNodesRef(value: any): value is InternalRef<$Nodes> {
   return value instanceof Object && INTERNAL in value && value[INTERNAL] instanceof MetaListRef
}

type RefReturn<T extends RefSource, A> = A extends never[] ? $Nodes<T> : $Node<T>

/**
 * @public
 */
export function NodeRef<
   T extends RefSource,
   A,
>(source: T, array?: A & never[]): A extends never[] ? $Nodes<T> : $Node<T> {
   const $node = createNodeRef(array)
   if (array) {
      const ref = $node[INTERNAL] as MetaListRef

      const flask = getFlask()
      flask.onDiscard(() => {
         ref.value = [] // clear nodes
      })

      // TODO: there has to be a better way T_T
      if (isSettingUpList()) {
         onBeforeListUpdate(() => {
            ref.prepUpdate();
         }, flask)

         onListUpdated((toFromIndices) => {
            ref.update(toFromIndices)
         }, flask)
      }
   }
   return $node as unknown as RefReturn<T, A>
}

type ExposedNode = AnyObject

export function createNodeRef<A extends ExposedNode[] | undefined>(
   array: A,
): A extends ExposedNode[] ? InternalRef<$Nodes> : InternalRef<$Node> {
   const ref = array ? new MetaListRef($value, array) : new MetaRef($value)
   function $value() {
      return ref.value;
   }
   $value[INTERNAL] = ref

   return $value as A extends ExposedNode[] ? InternalRef<$Nodes> : InternalRef<$Node>
}

export class MetaRef {
   constructor(
      readonly $value: () => unknown,
   ) { }

   public value: unknown
}

export class MetaListRef {
   constructor(
      readonly $value: () => unknown[],
      public value: unknown[],
   ) {

   }

   assignIndex($index: Ion<number>, item: unknown) {
      const list = this.value
      list[$index()] = item;
   }

   prevValue?: unknown[]

   prepUpdate() {
      this.prevValue = this.value
      this.value = []
   }

   update(toFromIndices: [number, number][]) {
      const prev = this.prevValue;
      if (!prev) throw new Error('prevNodes were not store, must call prepUpdate before list update')
      const newList = this.value;
      for (const indices of toFromIndices) {
         const [to, from] = indices
         const node = prev[from];
         newList[to] = node;
      }
      this.prevValue = undefined;
   }
}

export function initializeListRef( // should this be initialize ref?
   $nodes: InternalRef<$Nodes>,
   value: NodeReferent | undefined,
   $index: Ion<number>
) {
   const ref = $nodes[INTERNAL]
   if (value) {
      ref.assignIndex($index, value);
   }
}

export function initializeRef($node: InternalRef<$Node>, value: any | undefined) {
   const ref = $node[INTERNAL]
   if (ref.value)
      throw new Error("Node ref has already been assigned. A node ref can only be associated with a single dom node or component instance")
   if (value) {
      ref.value = value;
      const flask = getActiveFlask()
      flask?.onDiscard(() => {
         ref.value = undefined
      })
   }
}
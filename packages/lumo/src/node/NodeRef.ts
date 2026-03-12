import { Component, PublicComponent } from "../component/Component"
import { TagName } from "../element/makeElement"
import { Ion, toValue } from "@rue/quarky"
import { getActiveFlask, getFlask } from "@rue/flask"
import { AnyObject } from "@rue/types"

export const INTERNAL = Symbol('internal')

type RefSource = TagName | ((...args: any[]) => Component)


export type NodeReferent<
   T extends RefSource = RefSource
> =
   T extends TagName ? HTMLElementTagNameMap[T] : // TODO: SVGs and Math elements
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

export type State<T extends RefSource> = NodeReferent<T>

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

type RefReturn<T extends RefSource> = $Node<T>

/**
 * @public
 */
export function NodeRef<
   T extends RefSource
>(source: T): $Node<T> {
   return createNodeRef()

}

type ExposedNode = AnyObject

export function createNodeRef(): InternalRef<$Node> {
   const ref = new MetaRef($value)
   function $value() {
      return ref.value;
   }
   $value[INTERNAL] = ref

   return $value
}

export class MetaRef {
   constructor(
      readonly $value: () => unknown,
   ) { }

   public value: unknown
}


export function initializeRef($node: InternalRef<$Node>, value: any | undefined) {
   const ref = $node[INTERNAL]
   if (ref.value) {
      console.warn("Node ref has already been assigned. A node ref can only be associated with a single dom node or component instance")
      return;
   }
   if (value) {
      console.log('initializing ref', value, toValue(value))
      ref.value = toValue(value);
      getActiveFlask()?.onDiscard(() => {
         ref.value = undefined
      })
   }
}
import { TagName } from "../element/setUpElement"
import { toValue } from "@luent/quarky"
import { getActiveFlask, getFlask } from "@luent/flask"
import { AnyObject, Glass } from "@luent/types"
import { ComponentTag } from "../component/Component"


/**
* Type helper to use DOM node as jsx
* @param node 
* @returns 
*/
export function asJSX<T>(node: T): (setup: {}) => JSX.Element { // FIX: fix type
  return node as any
}

export const INTERNAL = Symbol('internal')

export type RefSource = TagName | ComponentTag

export type NodeReferent<
  T extends RefSource = RefSource
> =
  T extends TagName ? HTMLElementTagNameMap[T] : // TODO: SVGs and Math elements
  T

export type ComponentRef<C> = C extends (setup: infer S) => infer R ?
  S extends { ref?: () => infer F } ? NonNullable<F> : R extends { as: infer E } ? E : never : never
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

// export type State<T extends RefSource> = NodeReferent<T>

export type NodeRef<T extends RefSource = RefSource> = { (): NodeReferent<T> | undefined }

export type InternalRef<T> = T & { [INTERNAL]: MetaRef }

/**
 * @internal
*/
export function isAnyNodeRef(value: any): value is InternalRef<NodeRef> {
  return value instanceof Object && INTERNAL in value
}

/**
 * @internal
*/
export function isNodesRef(value: any): value is InternalRef<$Nodes> {
  return value instanceof Object && INTERNAL in value && value[INTERNAL] instanceof MetaListRef
}

type RefReturn<T extends RefSource> = NodeRef<T>

/**
 * @public
 */
export function NodeRef<
  T extends RefSource
>(source: T): T extends string ? NodeRef<T> : NodeRef<ComponentRef<T>> {
  return createNodeRef()

}

type ExposedNode = AnyObject

export function createNodeRef(): InternalRef<NodeRef> {
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


export function initializeRef($node: InternalRef<NodeRef>, value: any | undefined) {
  const ref = $node[INTERNAL]
  if (ref.value) {
    if (__DEV__) console.warn("Node ref has already been assigned. A node ref can only be associated with a single dom node or component instance", ref.value)
    return;
  }
  if (value) {
    ref.value = toValue(value);
    getActiveFlask()?.onDiscard(() => {
      ref.value = undefined
    })
  }
}
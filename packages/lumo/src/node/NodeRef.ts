import { Component, PublicComponent } from "../component/InternalComponent"
import { _NodePod } from "./NodePod"
import { HTMLTag } from "../element/makeElement"
import { isSettingUpList, onBeforeListUpdate, onListUpdated } from "../iteratives/listStack"
import { protect, AtomicIon, ref } from "@rue/quarky"
import { READONLY } from "../../../quarky/src/ion/ProtectedIon"
import { getFlask } from "@rue/flask"



// type Task = ((item: Element | PublicComponent) => void) | ((item: Element | PublicComponent, $index?: AtomicIon<number>) => void)
// const hookMap: WeakMap<NodeRef, Set<Task>> = new WeakMap()

type RefSource = HTMLTag | ((...args: any[]) => Component)


/* 
* o property:
* - undefined means ref has not been set or has been removed from the DOM
* - null means component did not expose anything
*/
// export class NodeRef<
//     T extends RefSource
//     = RefSource
// > {
//     readonly o: NodeReferent<T> | undefined; // o stands for object (as in target) of reference 
// }

// export type ViewNodePod<>

export type NodesIon<T extends RefSource = RefSource> = () => NodeReferent<T>[]
export type NodeRef<T extends RefSource = RefSource> = () => NodeReferent<T> | undefined
export type _NodeRef<T extends RefSource = RefSource> = AtomicIon<NodeReferent<T> | undefined>
export type _NodesIon<T extends RefSource = RefSource> = AtomicIon<NodeReferent<T>[]>

// map readonly $node to $node
const $nodeMap: WeakMap<NodeRef | NodesIon, _NodeRef | _NodesIon> = new WeakMap()

export function getNodeRef($nodeAsReadonly: NodeRef | NodesIon) {
   const $node = $nodeMap.get($nodeAsReadonly);
   if (!$node) throw new Error("No $node :(. This should never happen")
   return $node;
}

export function NodeRef<
   T extends RefSource
   = RefSource
>(source: T) {
   let $node = ref(undefined) as NodeRef<T>;
   if (__DEV__) {
      $node = asReadonlyNodeRef($node) as NodeRef<T>
   }
   return $node as NodeRef<T>;
}

export function NodesRef<T extends RefSource = RefSource>(source: T): NodesIon<T> {
   let $nodes = ref([]) as NodesIon<T>
   if (__DEV__) {
      $nodes = asReadonlyNodeRef($nodes) as NodesIon<T>
   }
   const _ref = new InternalNodeArrayRef($nodes)

   const flask = getFlask()
   flask?.onDisposal(() => {
      _ref.setValue([]); // clear nodes
   })

   if (isSettingUpList()) {
      onBeforeListUpdate(() => {
            _ref.prepUpdate();
      }, {until: flask!.onDisposal})

      onListUpdated((toFromIndices) => {
         _ref.update(toFromIndices)
      }, { until: flask!.onDisposal })
   }
   nodeArrayRefMap.set($nodes, _ref);
   return $nodes
}

function asReadonlyNodeRef($node: NodeRef | NodesIon) {
   const $nodeAsReadonly = protect($node, READONLY);
   $nodeMap.set($nodeAsReadonly, <_NodeRef | _NodesIon>$node)
   return $nodeAsReadonly
}


export type NodeReferent<
   T extends RefSource = RefSource
> =
   T extends HTMLTag ? HTMLElementTagNameMap[T] : //TODO: SVGs and Math elements
   T extends (...args: any[]) => infer R ?
   R extends Component<infer I> ?
   I extends PublicComponent ? I
   : undefined : undefined : undefined

export class InternalNodeRef<
   T extends RefSource
   = RefSource> {
   o: _NodeRef
   constructor(
      ref: NodeRef
   ) {
      this.o = __DEV__ ? getNodeRef(ref) as _NodeRef : ref as _NodeRef
   }

   setValue(value: NodeReferent<T> | undefined) {
      this.o.as(value)
      return value;
   }

   assignValue(value: NodeReferent<T>) {
      this.setValue(value) // will never change for static entities
   }
}

// type NodeArray<T extends RefSource = RefSource> = Exclude<NodeReferent<Exclude<T, HTMLTag | null | ComponentSetup>>, null>;

const nodeArrayRefMap: Map<NodesIon, InternalNodeArrayRef> = new Map()

export function getNodeArrayRef(nodeRef: NodesIon) {
   const listRef = nodeArrayRefMap.get(nodeRef)
   nodeArrayRefMap.delete(nodeRef);
   return listRef
}

export class InternalNodeArrayRef {
   o: _NodesIon
   constructor(
      ref: NodesIon
   ) {
      this.o = __DEV__ ? getNodeRef(ref/* readonly ref */) as _NodesIon : ref as _NodesIon
   }

   setValue(value: NodeReferent[]) {
      this.o.as(value)
      return value;
   }

   insertNode(node: NodeReferent, index: number) {
      const pod = this.setValue(this.o()) //QUESTION: Why am I setting the ref to its own value??
      pod.splice(index, 0, node); //TODO: should this be splice?
   }

   removeNode(index: number) {
      const pod = this.o()
      pod?.splice(index, 1);
   }

   assignValue(value: NodeReferent, $index: AtomicIon<number>) {
      const nodes = this.o()
      nodes[$index()] = value;
   }

   prevNodes?: NodeReferent[]

   prepUpdate(){
      this.prevNodes = this.o();
      this.o.as([])
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
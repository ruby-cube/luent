import { Component, PublicComponent } from "../component/InternalComponent"
import { _NodePod } from "./NodePod"
import { HTMLTag } from "../element/makeElement"
import { isUpdatingList } from "../iteratives/listStack"
import { protect, AtomicIon, ref } from "@rue/quarky"
import { READONLY } from "../../../quarky/src/ion/ProtectedIon"



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

type ListUpdates = any[]
const listUpdateMap: WeakMap<InternalNodeArrayRef, ListUpdates> = new WeakMap()

const nodeArrayRefMap: WeakMap<NodeReferent[], InternalNodeArrayRef> = new WeakMap()

export function getNodeArrayRef(nodes: NodeReferent[]) {
    return nodeArrayRefMap.get(nodes)
}

export class InternalNodeArrayRef {
    // preserve: boolean = false;
    // preserved: T | undefined = undefined;
    initialized: boolean = false; // prevent multiple initializations for arrays
    o: _NodesIon
    constructor(
        ref: NodesIon
    ) {
        this.o = __DEV__ ? getNodeRef(ref) as _NodesIon : ref as _NodesIon
    }

    setValue(value: NodeReferent[]) {
        this.o.as(value)
        return value;
    }

    insertNode(node: NodeReferent, index: number) {
        const pod = this.setValue(this.o())
        pod.splice(index, 0, node); //TODO: should this be splice?
    }

    removeNode(index: number) {
        const pod = this.o()
        pod?.splice(index, 1);
    }

    markInitialized() {
        this.initialized = true;
    }

    assignValue(value: NodeReferent, $index: AtomicIon<number>) {
        let nodes = !__SSR__ && isUpdatingList() ? this.getNewListNodes()
            : this.o.as(this.o())
        nodes[$index()] = value;
        nodeArrayRefMap.set(nodes, this);
    }

    getNewListNodes() {
        let nodes = listUpdateMap.get(this);
        if (!nodes) {
            nodes = []
            listUpdateMap.set(this, nodes)
        }
        return nodes;
    }

    updateListRef(toFromIndices: [number, number][]) {
        const prevNodes: NodeReferent[] = this.o();
        const newNodes = listUpdateMap.get(this) || [];
        for (const indices of toFromIndices) {
            const [to, from] = indices
            const node = prevNodes[from];
            newNodes[to] = node;
        }
        this.o.as(newNodes);
        listUpdateMap.delete(this)
        nodeArrayRefMap.set(newNodes, this);
    }
}





// export function assignNodeRef(ref: InternalNodeRef, value: Element | PublicComponent, $index: AtomicIon<number> | undefined) {
//     if ($index != null) {
//         let nodes = <(Element | PublicComponent)[]>ref.o.value || []
//         nodes[$index()] = value;
//     }
//     else {
//         //@ts-ignore readonly
//         ref.o.value = value // will never change for static entities
//     }
//     nodeArrayRefMap.set(value, ref);
// }



// function assignNodeRef(ref: InternalNodeRef<InternalComponent>, component: AnyObject, $index: AtomicIon<number> | undefined) {
//     if ($index != null) {
//         let nodes = ref.components ? ref.components! : []
//         nodes[$index()] = component;
//     }
//     else {
//         ref.component = component
//     }
// }
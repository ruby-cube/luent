import { PublicComponent, ComponentSetup } from "../component/InternalComponent"
import { _NodePod } from "./NodePod"
import { ArrayItem } from "@rue/types"
import { isUpdatingList, onListUpdated } from "../list/forEachIn"
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit"
import { $Signal, Signal } from "@rue/muonic/$Signal"
import { asReadonly, ReadonlySignal } from "@rue/muonic/asReadonly"



type Task = ((item: Element | PublicComponent) => void) | ((item: Element | PublicComponent, $index?: Signal<number>) => void)
const hookMap: WeakMap<NodeSignal, Set<Task>> = new WeakMap()

type RefSource = Element | ComponentSetup | Element[] | ComponentSetup[]


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

export type NodeSignal<T extends RefSource = RefSource> = () => NodeReferent<T> | undefined
export type _NodeSignal<T extends RefSource = RefSource> = Signal<NodeReferent<T> | undefined>

const $nodeMap: WeakMap<NodeSignal, _NodeSignal> = new WeakMap()

export function get$Node($nodeAsReadonly: NodeSignal) {
    const $node = $nodeMap.get($nodeAsReadonly);
    if (!$node) throw new Error("No $node :(. This should never happen")
    return $node;
}

export function $Node<
    T extends RefSource
    = RefSource
>() {
    const $node = $Signal<NodeReferent<T> | undefined | null>();
    if (__DEV__) {
        const $nodeAsReadonly = asReadonly($node) as ReadonlySignal<NodeReferent<T> | undefined | null>;
        $nodeMap.set($nodeAsReadonly, $node)
    }
    return $node;
}



type NodeReferent<
    T extends RefSource
    = RefSource
> =
    T extends Element ? T :
    T extends Element[] ? T :
    T extends (...args: any[]) => infer R ?
    R extends (infer I)[] ?
    I extends PublicComponent | JSX.Element ?
    Exclude<I, JSX.Element>
    : I extends PublicComponent | ConditionalRenderKit ?
    Exclude<I, ConditionalRenderKit> :
    T extends ((...args: any[]) => infer R)[] ?
    R extends (infer I)[] ?
    I extends PublicComponent | JSX.Element ?
    Exclude<I, JSX.Element>[]
    : I extends PublicComponent | ConditionalRenderKit ?
    Exclude<I, ConditionalRenderKit>[]
    : [] // component that doesn't expose anything
    : []
    : null
    : null // component that doesn't expose anything
    : null


type NodeArray<T extends RefSource = RefSource> = Exclude<NodeReferent<Exclude<T, Element | null | ComponentSetup>>, null>;

type ListUpdates = any[]
const listUpdateMap: WeakMap<InternalNodeRef, ListUpdates> = new WeakMap()

export class InternalNodeRef<
    T extends RefSource
    = RefSource> {
    // preserve: boolean = false;
    // preserved: T | undefined = undefined;
    initialized: boolean = false; // prevent multiple initializations for arrays
    o: _NodeSignal<RefSource>
    constructor(
        ref: NodeSignal<RefSource>
    ) {
        this.o = __DEV__ ? get$Node(ref) : ref as _NodeSignal<RefSource>
    }

    setValue(value: NodeReferent<T> | null | undefined) {
        this.o.set(() => value)
        return value;
    }

    insertNode(node: ArrayItem<NodeArray<T>>, index: number) {
        const pod = this.setValue(this.o() || [] as unknown as NodeReferent<T>)! as NodeArray<T>
        pod.splice(index, 0, node); //TODO: should this be splice?
    }

    removeNode(index: number) {
        const pod = this.o() as NodeArray<T>
        pod.splice(index, 1);
    }

    markInitialized() {
        this.initialized = true;
    }

    assignValue(value: NodeReferent<T>, $index: Signal<number> | undefined) {
        if ($index != null) {
            let nodes = isUpdatingList() ? this.getNewListNodes()
                : this.o.set(() => (this.o() || []) as NodeArray<T>)
            nodes[$index()] = value as ArrayItem<NodeArray<T>>;
            refMap.set(nodes, this);
        }
        else {
            this.setValue(value) // will never change for static entities
        }

        if (value) {
            refMap.set(value, this);
        }
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
        const prevNodes: NodeReferent[] = this.o() || [];
        const newNodes = listUpdateMap.get(this) || [];
        for (const indices of toFromIndices) {
            const [to, from] = indices
            const node = prevNodes[from];
            newNodes[to] = node;
        }
        this.o.set(() => newNodes);
        listUpdateMap.delete(this)
        refMap.set(newNodes, this);
    }
}



const refMap: WeakMap<Exclude<NodeReferent, null>, InternalNodeRef> = new WeakMap()

export function getNodeRef(referent: any) { // AnyObject is component's exposed methods and state
    return refMap.get(referent)
}

// export function assignNodeRef(ref: InternalNodeRef, value: Element | PublicComponent, $index: Signal<number> | undefined) {
//     if ($index != null) {
//         let nodes = <(Element | PublicComponent)[]>ref.o.value || []
//         nodes[$index()] = value;
//     }
//     else {
//         //@ts-ignore readonly
//         ref.o.value = value // will never change for static entities
//     }
//     refMap.set(value, ref);
// }



// function assignNodeRef(ref: InternalNodeRef<InternalComponent>, component: AnyObject, $index: Signal<number> | undefined) {
//     if ($index != null) {
//         let nodes = ref.components ? ref.components! : []
//         nodes[$index()] = component;
//     }
//     else {
//         ref.component = component
//     }
// }
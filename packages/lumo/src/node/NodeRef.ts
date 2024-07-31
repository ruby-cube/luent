import { PublicComponent, ComponentSetup } from "../component/component"
import { _NodePod } from "./NodePod"
import { Signal } from "@rue/muonic/useSignalize"
import { ConditionalRenderKit } from "../conditional/$if"
import { ArrayItem } from "@rue/types"



type Task = ((item: Element | PublicComponent) => void) | ((item: Element | PublicComponent, $index?: Signal<number>) => void)
const hookMap: WeakMap<NodeRef, Set<Task>> = new WeakMap()

type RefSource = Element | ComponentSetup | Element[] | ComponentSetup[]


/* 
* o property:
* - undefined means ref has not been set or has been removed from the DOM
* - null means component did not expose anything
*/
export class NodeRef<
    T extends RefSource
    = RefSource
> {
    readonly o: NodeReferent<T> | undefined; // o stands for object (as in target) of reference 
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


type NodeArray<T extends RefSource> = Exclude<NodeReferent<Exclude<T, Element | null | ComponentSetup>>, null>;

export class InternalNodeRef<
    T extends RefSource
    = RefSource> {
    // preserve: boolean = false;
    // preserved: T | undefined = undefined;
    initialized: boolean = false; // prevent multiple initializations for arrays
    constructor(
        public o: NodeRef<T>
    ) { }

    setValue(value: NodeReferent<T> | null | undefined) {
        //@ts-expect-error read-only
        this.o.o = value;
        const eh = this.o.o;
        return value;
    }

    insertNode(node: ArrayItem<NodeArray<T>>, index: number) {
        const pod = this.setValue(this.o.o || [] as unknown as NodeReferent<T>)! as NodeArray<T>
        pod.splice(index, 0, node); //TODO: should this be splice?
    }

    removeNode(index: number) {
        const pod = this.o.o as NodeArray<T>
        pod.splice(index, 1);
    }

    markInitialized() {
        this.initialized = true;
    }

    assignValue(value: NodeReferent<T>, $index: Signal<number> | undefined) {
        if ($index != null) {
            let nodes = (this.o.o || []) as NodeArray<T>
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
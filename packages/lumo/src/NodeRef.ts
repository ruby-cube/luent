import { $listen, ActiveListener, ListenerOptions, ScheduleStop } from "@rue/flask"
import { Component, ComponentSetup, DOMNode, InternalComponent } from "./component"
import { _NodePod } from "./NodePod"
import { removeItem } from "@rue/utils"
import { Signal } from "../../muonic/useSignalize"
import { HTMLTag } from "./mE"




type Something<T extends HTMLElement> = T;


type Task = ((item: HTMLElement | Component) => void) | ((item: HTMLElement | Component, $index?: Signal<number>) => void)
const hookMap: WeakMap<NodeRef, Set<Task>> = new WeakMap()

export class NodeRef<T extends HTMLElementTagNameMap[HTMLTag] | Component = HTMLElement | Component> { //TODO: Add generics
    // readonly node?: HTMLElement
    // readonly nodes?: HTMLElement[]
    // readonly component?: Component
    // readonly components?: Component[]
    readonly value: T | T[] | null = null;
    // private list?: ListData
    // private initialized: boolean = false

    constructor(
        public readonly nodeType: HTMLTag | ComponentSetup,
        // list?: ListData
    ) {
        // this.list = list;
    }

    // onCreated(callback: (item: T, $index?: Signal<number>) => void, options?: { until: ScheduleStop; }) { //TODO: should index be a Signal?
    //     let tasks = hookMap.get(this);
    //     if (!tasks) {
    //         tasks = new Set();
    //         hookMap.set(this, tasks);
    //     }

    //     return $listen(callback, options || {}, {
    //         enroll(cb) {
    //             tasks.add(cb)
    //         },
    //         remove(cb) {
    //             tasks.delete(cb);
    //         }
    //     })
    // }
}



export class _NodeRef<T extends HTMLElement | Component = HTMLElement | Component> {
    // preserve: boolean = false;
    // preserved: T | undefined = undefined;
    initialized: boolean = false; // prevent multiple initializations for arrays
    constructor(
        public o: NodeRef<T>
    ) { }

    setValue(value: T | T[] | null) {
        //@ts-ignore
        this.o.value = value;
        return value;
    }

    insertNode(node: T, index: number) {
        const pod = this.setValue(this.o.value || []) as T[];
        pod.splice(index, 0, node); //TODO: should this be splice?
    }

    removeNode(index: number) {
        const pod = this.o.value as T[]
        pod.splice(index, 1);
    }

    markInitialized() {
        this.initialized = true;
    }

    assignValue(value: T, $index: Signal<number> | undefined) {
        if ($index != null) {
            let nodes = <(HTMLElement | Component)[]>this.o.value || []
            nodes[$index()] = value;
            refMap.set(nodes, this);
        }
        else {
            this.setValue(value) // will never change for static entities
        }
        refMap.set(value, this);
    }

    // castOnCreatedHook(entity: T, $index: Signal<number> | undefined) {
    //     const tasks = hookMap.get(this.o)
    //     if (!tasks) return;
    //     for (const task of tasks) {
    //         task(entity, $index)
    //     }
    // }
}



const refMap: WeakMap<DOMNode | Component | DOMNode[] | Component[], _NodeRef> = new WeakMap()

export function getNodeRef(node: DOMNode | Component | DOMNode[] | Component[]) { // AnyObject is component's exposed methods and state
    return refMap.get(node)
}

// export function assignNodeRef(ref: _NodeRef, value: HTMLElement | Component, $index: Signal<number> | undefined) {
//     if ($index != null) {
//         let nodes = <(HTMLElement | Component)[]>ref.o.value || []
//         nodes[$index()] = value;
//     }
//     else {
//         //@ts-ignore readonly
//         ref.o.value = value // will never change for static entities
//     }
//     refMap.set(value, ref);
// }



// function assignNodeRef(ref: _NodeRef<InternalComponent>, component: AnyObject, $index: Signal<number> | undefined) {
//     if ($index != null) {
//         let nodes = ref.components ? ref.components! : []
//         nodes[$index()] = component;
//     }
//     else {
//         ref.component = component
//     }
// }
import { $listen, ActiveListener, ListenerOptions, ScheduleStop } from "@rue/flask"
import { Component, ComponentSetup, DOMNode, InternalComponent } from "./component"
import { _NodePod } from "./NodePod"
import { removeItem } from "@rue/utils"
import { Signal } from "../muonic/useSignalize"
import { HTMLTag } from "./mE"
import { ListData } from "./forEachIn"
import { AnyObject } from "@rue/types"





type Task = ((item: HTMLElement | InternalComponent) => void) | ((item: HTMLElement | InternalComponent, $index?: Signal<number>) => void)
const hookMap: WeakMap<_NodeRef, Task[]> = new WeakMap()

export class NodeRef<T extends HTMLElement | InternalComponent = HTMLElement | InternalComponent> { //TODO: Add generics
    readonly node?: HTMLElement
    readonly nodes?: HTMLElement[]
    readonly component?: Component
    readonly components?: Component[]
    private list?: ListData
    private initialized: boolean = false

    constructor(public nodeType: HTMLTag | ComponentSetup, list?: ListData) {
        this.list = list;
    }

    onCreated(callback: (item: T, $index?: Signal<number>) => void, options?: { until: ScheduleStop; }) { //TODO: should index be a Signal?
        const tasks = hookMap.get(<_NodeRef><unknown>this) ? hookMap.get(<_NodeRef><unknown>this)! : [];

        return $listen(callback, options, {
            enroll(cb) {
                tasks.push(cb)
            },
            remove(cb) {
                removeItem(cb, tasks);
            }
        })
    }
}


export function castOnCreatedHook(ref: _NodeRef, entity: HTMLElement | InternalComponent, $index: Signal<number> | undefined) {
    const tasks = hookMap.get(ref)
    if (!tasks) return;
    for (const task of tasks) {
        task(entity, $index)
    }
}

export type _NodeRef<T extends HTMLElement | InternalComponent = HTMLElement | InternalComponent> = {
    preserved: HTMLElement | Component | HTMLElement[] | Component[]
    node?: HTMLElement | null
    nodes?: HTMLElement[] | null
    component?: Component | null
    components?: Component[] | null
    list?: ListData;
    initialized: boolean;
    onCreated: (callback: (item: T, $index?: Signal<number>) => void, options?: {
        until: ScheduleStop;
    }) => ActiveListener
}


const refMap: WeakMap<DOMNode | Component, _NodeRef> = new WeakMap()

export function getNodRef(node: DOMNode | Component) { // AnyObject is component's exposed methods and state
    return refMap.get(node)
}

export function assignNodeRef(ref: _NodeRef, value: HTMLElement | Component, $index: Signal<number> | undefined) {
    if ($index != null) {
        const key = value instanceof HTMLElement ? 'nodes' : 'components'
        let nodes = ref[key] ? ref[key]! : []
        nodes[$index()] = value;
    }
    else if (value instanceof HTMLElement) {
        ref.node = value // will never change for static entities
    }
    else {
        ref.component = value; // will never change for static entities
    }
    refMap.set(value, ref);
}

export function nullNodeRef(node: DOMNode | Component, type: 'hide' | 'destroy' | 'preserve') {
    if (type === 'hide') return;
    const ref = getNodRef(node);
    if (ref && ref.node) {
        if (type === 'preserve') ref.preserved = ref.node;
        ref.node = null;
    }
    else if (ref && ref.nodes) {
        if (type === 'preserve') ref.preserved = ref.nodes;
        ref.nodes = null;
    }
}

// function assignNodeRef(ref: _NodeRef<InternalComponent>, component: AnyObject, $index: Signal<number> | undefined) {
//     if ($index != null) {
//         let nodes = ref.components ? ref.components! : []
//         nodes[$index()] = component;
//     }
//     else {
//         ref.component = component
//     }
// }
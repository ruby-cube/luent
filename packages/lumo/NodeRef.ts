import { $listen, ActiveListener, ListenerOptions, ScheduleStop } from "@rue/flask"
import { Component, ComponentSetup, InternalComponent } from "./component"
import { _NodePod } from "./NodePod"
import { removeItem } from "@rue/utils"
import { Signal } from "../muonic/useSignalize"
import { HTMLTag } from "./mE"
import { ListData } from "./forEachIn"





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
    if (!tasks) throw new Error("OnCreated tasks cannot be found")
    for (const task of tasks) {
        task(entity, $index)
    }
}

export type _NodeRef<T extends HTMLElement | InternalComponent = HTMLElement | InternalComponent> = {
    node?: HTMLElement
    nodes?: HTMLElement[]
    component?: Component
    components?: Component[]
    list?: ListData;
    initialized: boolean;
    onCreated: (callback: (item: T, $index?: Signal<number>) => void, options?: {
        until: ScheduleStop;
    }) => ActiveListener
}

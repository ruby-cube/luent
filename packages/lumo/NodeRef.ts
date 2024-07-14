import { $listen, ListenerOptions, ScheduleStop } from "@rue/flask"
import { Component, InternalComponent } from "./component"
import { _NodePod } from "./NodePod"
import { removeItem } from "@rue/utils"
import { Signal } from "../muonic/useSignalize"

type Task = ((item: HTMLElement) => void) | ((item: HTMLElement, index?: number) => void)
const hookMap: WeakMap<_NodeRef, Task[]> = new WeakMap()

export class NodeRef { //TODO: Add generics
    readonly node?: HTMLElement
    readonly nodes?: HTMLElement[]
    readonly component?: Component
    readonly components?: Component[]
    onCreated(callback: (item: HTMLElement, index?: number) => void, options?: { until: ScheduleStop; }) { //TODO: should index be a Signal?
        const tasks = hookMap.get(this) ? hookMap.get(this)! : [];

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

export type _NodeRef = {
    node?: HTMLElement
    nodes?: HTMLElement[]
    component?: Component
    components?: Component[]
}

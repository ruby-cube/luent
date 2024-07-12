import { $listen, ListenerOptions, ScheduleStop } from "@rue/flask"
import { Component } from "./component"
import { _NodePod } from "./NodePod"
import { removeItem } from "@rue/utils"

type Task = ((item: HTMLElement) => void) | ((item: HTMLElement, index?: number) => void)
const hookMap: WeakMap<_NodeRef, Task[]> = new WeakMap()

export class NodeRef {
    readonly node?: HTMLElement
    readonly nodes?: HTMLElement[]
    readonly component?: Component
    readonly components?: Component[]
    onCreated(callback: ((item: HTMLElement) => void) | ((item: HTMLElement, index?: number) => void), options?: { until: ScheduleStop; }) {
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

export function castOnCreatedHook(ref: _NodeRef, domNode: HTMLElement, index: number | undefined) {
    const tasks = hookMap.get(ref)
    if (!tasks) throw new Error("BeforeNodeMount tasks cannot be found")
    for (const task of tasks) {
        task(domNode, index)
    }
}

export type _NodeRef = {
    node?: HTMLElement
    nodes?: HTMLElement[]
    component?: Component
    components?: Component[]
}
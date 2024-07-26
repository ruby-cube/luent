import { AnyObject } from "@rue/types";
import { LifecycleHook } from "./lifecycle";
import { RenderSlot, SlotRenderer } from "./mO";
import { _NodeRef } from "./NodeRef";
import { AssignAttributes, EventHandler, NodeEntity, RenderFunction } from "./makeNode";
import { DerivedSignal } from "@rue/muonic";

// export type NodeRef = Signal<Component | DOMNode | (DOMNode | Component)[]>

export type DOMNode = CharacterData | HTMLElement
export type Props = {
    [key: string]: any;
    slot?: RenderSlot | SlotRenderer
}



export type ComponentSetup<T extends AnyObject | never = AnyObject> =
    T extends AnyObject ?
    (props: T) => NodeEntity[] | NodeEntity
    : RenderFunction

export type Component = AnyObject // contains anything in expose

export class InternalComponent {
    context: AnyObject | undefined;
    provides: AnyObject | undefined;
    component: Component | undefined;
    attributes: AssignAttributes | null = null;
    parent: InternalComponent | null;
    nodeEntities: NodeEntity[] = []; //TODO: add context type?? //QUESTION: should this be cleared or updated?
    preserve: boolean;
    tasks: {
        [LifecycleHook.BEFORE_MOUNT]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_UNMOUNT]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_UPDATE]: Set<() => void> | undefined;
        [LifecycleHook.MOUNTED]: Set<() => void> | undefined;
        [LifecycleHook.UNMOUNTED]: Set<() => void> | undefined;
        [LifecycleHook.UPDATED]: Set<() => void> | undefined;
        [LifecycleHook.ACTIVATED]: Set<() => void> | undefined;
        [LifecycleHook.DEACTIVATED]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.BEFORE_MOUNT]: undefined,
            [LifecycleHook.MOUNTED]: undefined,
            [LifecycleHook.BEFORE_UNMOUNT]: undefined,
            [LifecycleHook.BEFORE_UPDATE]: undefined,
            [LifecycleHook.UNMOUNTED]: undefined,
            [LifecycleHook.UPDATED]: undefined,
            [LifecycleHook.ACTIVATED]: undefined,
            [LifecycleHook.DEACTIVATED]: undefined,
        };

    hasUpdates: boolean = false;

    constructor(parent: InternalComponent | null, preserve: boolean) {
        this.parent = parent;
        this.preserve = preserve
    }

    private getTaskQueue(hookName: LifecycleHook) {
        let taskQueue = this.tasks[hookName]
        // if (!taskQueue) throw new Error("taskQueue not found")
        return taskQueue;
    }

    emit(hookName: LifecycleHook) {
        const taskQueue = this.getTaskQueue(hookName);
        if (!taskQueue) return;
        for (const task of taskQueue) {
            task();
        }
    }


}


// Manages component "stack"
let currentComponent: InternalComponent | null  = null;
let prevComponent: InternalComponent | null  = null;

export function getCurrentComponent() {
    return currentComponent;
}

export function pushComponent(component: InternalComponent | null ) {
    prevComponent = currentComponent;
    currentComponent = component;
}

export function popComponent() {
    currentComponent = prevComponent;
}




export function expose(component: AnyObject) {
    const _component = getCurrentComponent();
    if (_component === null) throw new Error("Cannot call `expose` outside of component setup")
    _component.component = component;
}

// export function runUpdates(this: InternalComponent) {
//     const taskQueue = useTaskQueue(this);
//     for (const task of taskQueue) {
//         task();
//     }
//     taskQueue.clear();
// }


// function useTaskQueue(component: InternalComponent) {
//     let taskQueue = component.updates
//     if (!taskQueue) {
//         taskQueue = new Set();
//         component.updates = taskQueue;
//     }
//     return taskQueue;
// }
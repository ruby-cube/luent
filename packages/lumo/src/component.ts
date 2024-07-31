import { AnyObject } from "@rue/types";
import { LifecycleHook } from "./lifecycle";
import { InternalNodeRef } from "./NodeRef";
import { EventHandler, NodeEntity, RenderFunction } from "./makeNode";
import { DerivedSignal } from "@rue/muonic";

// export type NodeRef = Signal<PublicComponent | DOMNode | (DOMNode | PublicComponent)[]>

export type DOMNode = CharacterData | Element
export type Props = {
    [key: string]: any;
    slot?: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
}

export type RenderSlotted<P extends any = undefined> =
    P extends undefined ? () => NodeEntity | NodeEntity[]
    : (props: P) => NodeEntity | NodeEntity[]

export type Slotted = NodeEntity | NodeEntity[]


export type ComponentSetup<P = any> = P extends never ?
    (() => NodeEntity[] | NodeEntity) | (() => [PublicComponent, NodeEntity[] | NodeEntity]) :
    ((props: P) => NodeEntity[] | NodeEntity) | ((props: P) => [PublicComponent, NodeEntity[] | NodeEntity])

export type PublicComponent = { COMPONENT: true } // contains anything in expose

export class InternalComponent {
    context: AnyObject | undefined;
    provides: AnyObject | undefined;
    component: PublicComponent | null = null;
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
let currentComponent: InternalComponent | null = null;
let prevComponent: InternalComponent | null = null;

export function getCurrentComponent() {
    return currentComponent;
}

export function pushComponent(component: InternalComponent | null) {
    prevComponent = currentComponent;
    currentComponent = component;
}

export function popComponent() {
    currentComponent = prevComponent;
}


export const COMPONENT = Symbol()

export function expose<T extends AnyObject>(component: T) {
    const _component = getCurrentComponent();
    if (_component === null) throw new Error("Cannot call `expose` outside of component setup")
    const publicComponent = _component.component = {
        COMPONENT: true as const,
        ...component
    };
    return publicComponent;
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
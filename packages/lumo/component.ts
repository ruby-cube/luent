import { AnyObject } from "@rue/types";
import { Slot } from "./mXSlot";
import { Signal } from "../muonic/useSignalize";
import { LifecycleHook } from "./lifecycle";
import { ListRenderKit } from "./mXsFor";
import { InitialConditionalRenderKit } from "./mXIf";
import { ReactiveSignal } from "../muonic/useDerivedSignal";
import { NodeEntity } from "./mX";
import { U } from "vitest/dist/types-94cfe4b4";

// export type NodeRef = Signal<Component | DOMNode | (DOMNode | Component)[]>

export type DOMNode = CharacterData | HTMLElement
export type Props = {
    [key: string]: any;
    slot?: Slot;
    slots?: {
        [key: string]: Slot
    },
}



export type ComponentSetup<T extends Props = AnyObject> = (props?: T, context?: AnyObject) => {
    render: () => NodeEntity[] | NodeEntity;
    exposes?: AnyObject;
    provides?: AnyObject;
    scoped?: string;
    global?: string;
}

export type Component = AnyObject // contains anything in expose

export class InternalComponent {
    context: AnyObject | undefined;
    provides: AnyObject | undefined;
    component: Component | undefined;
    parent: InternalComponent | 'root';
    initialNodeEntities: NodeEntity[] = []; //TODO: add context type?? //QUESTION: should this be cleared or updated?
    tasks: {
        [LifecycleHook.PREMOUNT]: Set<() => void> | undefined;
        [LifecycleHook.PREUNMOUNT]: Set<() => void> | undefined;
        [LifecycleHook.PREUPDATE]: Set<() => void> | undefined;
        [LifecycleHook.MOUNTED]: Set<() => void> | undefined;
        [LifecycleHook.UNMOUNTED]: Set<() => void> | undefined;
        [LifecycleHook.UPDATED]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.PREMOUNT]: undefined,
            [LifecycleHook.MOUNTED]: undefined,
            [LifecycleHook.PREUNMOUNT]: undefined,
            [LifecycleHook.PREUPDATE]: undefined,
            [LifecycleHook.UNMOUNTED]: undefined,
            [LifecycleHook.UPDATED]: undefined,
        };

    hasUpdates: boolean = false;

    constructor(parent: InternalComponent | 'root') {
        this.parent = parent;
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


let currentComponent: InternalComponent | null | "root" = "root";

export function getCurrentComponent() {
    return currentComponent;
}

export function setCurrentComponent(component: InternalComponent | 'root' | null) {
    currentComponent = component
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
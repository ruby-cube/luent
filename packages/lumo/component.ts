import { AnyObject } from "@rue/types";
import { Slot } from "./mxSlot";
import { Signal } from "../muonic/useSignalize";
import { LifecycleHook } from "./lifecycle";
import { ListRenderKit } from "./mxsFor";
import { InitialConditionalRenderKit } from "./mxIf";
import { ReactiveSignal } from "../muonic/useDerivedSignal";
import { NodeEntity } from "./mx";

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
    render: () => NodeEntity[];
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
    initialNodeEntities: NodeEntity[] = []; //TODO: add context type??
    tasks: {
        [LifecycleHook.PREMOUNT]: Set<() => void>;
        [LifecycleHook.PREUNMOUNT]: Set<() => void> | undefined;
        [LifecycleHook.PREUPDATE]: Set<() => void> | undefined;
        [LifecycleHook.MOUNTED]: Set<() => void>;
        [LifecycleHook.UNMOUNTED]: Set<() => void> | undefined;
        [LifecycleHook.UPDATED]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.PREMOUNT]: new Set(),
            [LifecycleHook.MOUNTED]: new Set(),
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
        if (!taskQueue) throw new Error("taskQueue not found")
        return taskQueue;
    }

    emit(hookName: LifecycleHook) {
        const taskQueue = this.getTaskQueue(hookName);
        for (const task of taskQueue) {
            task();
        }
    }
}


let currentComponent: InternalComponent | null | "root" = "root";

export function getCurrentComponent() {
    return currentComponent;
}

export function setCurrentComponent(component: InternalComponent | 'root') {
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
import { AnyObject, MaybePromise } from "@rue/types";
import { LifecycleHook } from "./lifecycle";
import { InternalNodeRef } from "../node/$Node";
import { EventHandler, NodeEntity, RenderFunction } from "../node/makeNode";
import { DerivedSignal } from "@rue/muonic";
import { _NodePod } from "../node/NodePod";
import { EffectFlask, pushFlask } from "@rue/flask";
import { setUpNodeEntity } from "../node/setUpNodeEntity";
import { getCurrentComponent, popComponent, pushComponent } from "./componentStack";


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

export type PublicComponent = { [COMPONENT]: true } // contains anything in expose

export class InternalComponent {
    context: AnyObject | undefined;
    provides: AnyObject | undefined;
    component: PublicComponent | null = null;
    flask: EffectFlask | undefined;

    setFlask(flask: EffectFlask) {
        this.flask = flask;
    }

    nodePod: _NodePod | undefined;
    setNodePod(nodePod: _NodePod) {
        this.nodePod = nodePod;
    }

    nodeEntities: NodeEntity[] = []; // these are *initial* node entities. Node pods contain current nodes //TODO: add context type?? //QUESTION: should this be cleared or updated?
    tasks: {
        [LifecycleHook.SETUP_COMPLETED]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_MOUNT]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_UNMOUNT]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_UPDATE]: Set<() => void> | undefined;
        [LifecycleHook.MOUNTED]: Set<() => void> | undefined;
        [LifecycleHook.UNMOUNTED]: Set<() => void> | undefined;
        [LifecycleHook.UPDATED]: Set<() => void> | undefined;
        [LifecycleHook.ACTIVATED]: Set<() => void> | undefined;
        [LifecycleHook.DEACTIVATED]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.SETUP_COMPLETED]: undefined,
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

    constructor(
        public parent: InternalComponent | null,
        public preserve: boolean
    ) {
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

    mount(
        parentComponent: InternalComponent,
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) { //TODO: what if a component's root elements is conditional or a dynamic list??
        const nodeEntities = this.nodeEntities;
        if (!(parent instanceof Element))
            throw new Error("Parent cannot be a text node")
        this.emit(LifecycleHook.BEFORE_MOUNT);
        pushComponent(this)
        const _nodePod = nodePod.appendDynamicPod().appendNodePod();
        this.setNodePod(_nodePod)
        for (const nodeEntity of nodeEntities) {
            setUpNodeEntity(parentComponent, parent, nodeEntity, _nodePod, fragment)
        }
        popComponent()
        this.emit(LifecycleHook.MOUNTED);
    }


    unmount() {
        this.emit(LifecycleHook.BEFORE_UNMOUNT);
        const nodePod = this.nodePod;
        nodePod?.forEachNode((node) => node.remove())
        this.emit(LifecycleHook.UNMOUNTED);
    }
}




export const COMPONENT = Symbol('component')

export function expose<T extends AnyObject>(component: T) {
    const _component = getCurrentComponent<InternalComponent>();
    if (_component === null) throw new Error("Cannot call `expose` outside of component setup")
    const publicComponent = _component.component = {
        [COMPONENT]: true as const,
        ...component
    };
    return publicComponent;
}



// export function runUpdates(this: InternalComponent) {
//     const taskQueue = usePhaseQueue(this);
//     for (const task of taskQueue) {
//         task();
//     }
//     taskQueue.clear();
// }


// function usePhaseQueue(component: InternalComponent) {
//     let taskQueue = component.updates
//     if (!taskQueue) {
//         taskQueue = new Set();
//         component.updates = taskQueue;
//     }
//     return taskQueue;
// }



import { AnyObject, MaybePromise } from "@rue/types";
import { LifecycleHook } from "./lifecycle";
import { EventHandler, NodeEntity, RenderFunction } from "../node/makeNode";
import { _NodePod } from "../node/NodePod";
import { setUpNodeEntity } from "../node/setUpNodeEntity";
import { getCurrentComponent, popComponent, pushComponent } from "./componentStack";


export type DOMNode = CharacterData | Element
// export type Props = {
//     [key: string]: any;
//     Slot?: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
// }

// export type RenderSlot<P extends any = undefined> =
//     P extends undefined ? () => NodeEntity | NodeEntity[]
//     : (props: P) => NodeEntity | NodeEntity[]

// export type Slot = NodeEntity | NodeEntity[]
export type ComponentSetup<P extends never | AnyObject = never | AnyObject> = P extends never ? () => Component : (props: P) => Component

// export type Slot<T> = T extends AnyObject ? InternalComponent<T> : NodeEntity | NodeEntity[]
export const COMPONENT = Symbol('public component')
export type PublicComponent<T extends undefined | AnyObject = undefined | AnyObject> = T extends undefined ? undefined : { [COMPONENT]: true } & T // contains anything in expose

export interface Component<T extends undefined | AnyObject = undefined | AnyObject> {
    component: PublicComponent<T>;
    initialNodeEntities: NodeEntity
}

export function mx<T extends AnyObject = AnyObject>(render: NodeEntity): Component<T>
export function mx<T extends AnyObject = AnyObject>(exposedComponent: T | NodeEntity, render: NodeEntity): Component<T>
export function mx<T extends AnyObject = AnyObject>(exposedComponentOrRender: T | NodeEntity, render?: NodeEntity): Component<T> {

    const component = render ? { component: exposedComponentOrRender, initialNodeEntities: render } : {component: undefined, initialNodeEntities: exposedComponentOrRender}
    const unnestedComponent = unnestComponent(component) 

    return {
        component: arguments.length === 2 ? { [COMPONENT]: true as const, ...exposedComponentOrRender } : component !== unnestedComponent? unnestedComponent.component : undefined,
        initialNodeEntities: unnestedComponent.initialNodeEntities
    }
}

export class InternalComponent<T extends undefined | AnyObject = undefined | AnyObject> implements Component {
    // context: AnyObject | undefined;
    // provides: AnyObject | undefined;
    component: PublicComponent<T> | undefined = undefined;
    initialNodeEntities: NodeEntity[] | null = null; // these are *initial* node entities. Node pods contain current nodes //TODO: add context type?? //QUESTION: should this be cleared or updated?
    // flask: EffectFlask | undefined;

    // setFlask(flask: EffectFlask) {
    //     this.flask = flask;
    // }

    // nodePod: _NodePod | undefined;
    // setNodePod(nodePod: _NodePod) {
    //     this.nodePod = nodePod;
    // }

    tasks: {
        [LifecycleHook.SETUP_COMPLETED]: Set<() => void> | undefined;
        // [LifecycleHook.BEFORE_MOUNT]: Set<() => void> | undefined;
        // [LifecycleHook.BEFORE_UNMOUNT]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_UPDATE]: Set<() => void> | undefined;
        // [LifecycleHook.MOUNTED]: Set<() => void> | undefined;
        // [LifecycleHook.UNMOUNTED]: Set<() => void> | undefined;
        [LifecycleHook.UPDATED]: Set<() => void> | undefined;
        // [LifecycleHook.ACTIVATED]: Set<() => void> | undefined;
        // [LifecycleHook.BEFORE_DEACTIVATE]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.SETUP_COMPLETED]: undefined,
            // [LifecycleHook.BEFORE_MOUNT]: undefined,
            // [LifecycleHook.MOUNTED]: undefined,
            // [LifecycleHook.BEFORE_UNMOUNT]: undefined,
            [LifecycleHook.BEFORE_UPDATE]: undefined,
            // [LifecycleHook.UNMOUNTED]: undefined,
            [LifecycleHook.UPDATED]: undefined,
            // [LifecycleHook.ACTIVATED]: undefined,
            // [LifecycleHook.BEFORE_DEACTIVATE]: undefined,
        };

    hasUpdates: boolean = false;

    constructor(
        public parent: InternalComponent | null,
        // public preserve: boolean
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
        const nodeEntities = this.initialNodeEntities!;
        if (!(parent instanceof Element))
            throw new Error("Parent cannot be a text node")
        // this.emit(LifecycleHook.BEFORE_MOUNT);
        pushComponent(this)
        const _nodePod = nodePod.appendDynamicPod().appendNodePod(); //TODO: prevent overly nested node pods
        // this.setNodePod(_nodePod)
        for (const nodeEntity of nodeEntities) {
            setUpNodeEntity(parentComponent, parent, nodeEntity, _nodePod, fragment)
        }
        popComponent()
        // this.emit(LifecycleHook.MOUNTED);
    }
}


function unnestComponent(component: Component) {
    const nodeEntities = component.initialNodeEntities!;
    if (nodeEntities.length > 1 || nodeEntities.length === 0)
        return component;
    if (nodeEntities[0] instanceof InternalComponent) {
        const component = nodeEntities[0]
        if (!component.initialNodeEntities)
            return component;
        return unnestComponent(component)
    }
    return component
}



// export function expose<T extends AnyObject>(component: T) {
//     const _component = getCurrentComponent<InternalComponent>();
//     if (_component === null) throw new Error("Cannot call `expose` outside of component setup")
//     const publicComponent = _component.component = {
//         [COMPONENT]: true as const,
//         ...component
//     };
//     return publicComponent;
// }



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



import { AnyObject, MaybePromise } from "@rue/types";
import { EventHandler, NodeEntity, RenderFunction } from "../node/makeNode";
import { _NodePod } from "../node/NodePod";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { Provide } from "./provide";
import { ComponentOptions } from "./makeComponent";


export type DOMNode = CharacterData | Element
// export type Props = {
//     [key: string]: any;
//     Slot?: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
// }

// export type RenderSlot<P extends any = undefined> =
//     P extends undefined ? () => NodeEntity | NodeEntity[]
//     : (props: P) => NodeEntity | NodeEntity[]

// export type Slot = NodeEntity | NodeEntity[]
export type ComponentSetup<P extends never | AnyObject = never | AnyObject> = P extends never ? () => ComponentOutput : (setup: P) => ComponentOutput
export type ProviderComponentSetup<P extends never | AnyObject = never | AnyObject> = P extends never ? () => ComponentOutput : (setup: P, provide: Provide) => ComponentOutput

// export type Slot<T> = T extends AnyObject ? InternalComponent<T> : NodeEntity | NodeEntity[]
export const COMPONENT = Symbol('publicComponent')
export type PublicComponent<T extends AnyObject = AnyObject> = T // contains anything in expose

export interface Component<T> {
    component?: T;
    initialNodeEntities: NodeEntity
    mount: (
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) => void
}

export interface ComponentOutput<T = undefined> {
    component?: T extends AnyObject ? PublicComponent<T> : undefined;
    initialNodeEntities: NodeEntity
}

export function Component<T>(exposedComponent: T, render: NodeEntity | NodeEntity[]): ComponentOutput<T>
export function Component<T>(render: NodeEntity | NodeEntity[]): ComponentOutput<T>
export function Component<T>(renderOrComponent: T | (NodeEntity | NodeEntity[]), render?: NodeEntity | NodeEntity[]): ComponentOutput<T> {
    const _render = arguments.length === 2 ? render : renderOrComponent;
    const exposedComponent = arguments.length === 2 ? renderOrComponent : undefined;
    const unnestedNodeEntities = unnestComponent(_render)
    if (exposedComponent instanceof Object) {
        return {
            component: exposedComponent,
            initialNodeEntities: unnestedNodeEntities
        } as ComponentOutput<T>
    }
    return {
        component: undefined,
        initialNodeEntities: unnestedNodeEntities
    }
}

export class InternalComponent<T extends AnyObject = AnyObject> implements Component<T> {
    component: T | undefined = undefined;
    initialNodeEntities: NodeEntity[] | null = null; // these are *initial* node entities. Node pods contain current nodes //TODO: add context type?? //QUESTION: should this be cleared or updated?

    // tasks: {
    //     [LifecycleHook.ON_CREATED]: Set<() => void> | undefined;
    //     // [LifecycleHook.BEFORE_UPDATE]: Set<() => void> | undefined;
    //     // [LifecycleHook.ON_UPDATED]: Set<() => void> | undefined;
    // } = {
    //         [LifecycleHook.ON_CREATED]: undefined,
    //         // [LifecycleHook.BEFORE_UPDATE]: undefined,
    //         // [LifecycleHook.ON_UPDATED]: undefined,
    //     };

    // hasUpdates: boolean = false; //TODO: Remove

    constructor(
        // public parent: InternalComponent | null,
    ) {
    }

    mount(
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) { //TODO: what if a component's root elements is conditional or a dynamic list??
        const nodeEntities = this.initialNodeEntities!;
        if (!(parent instanceof Element))
            throw new Error("Parent cannot be a text node")
        // pushProvider(this)
        for (const nodeEntity of nodeEntities) {
            mountNodeEntity(parent, nodeEntity, nodePod, fragment)
        }
        // popProvider()
    }
}


function unnestComponent(nodeEntities: NodeEntity[]) {
    if (nodeEntities.length !== 1)
        return nodeEntities;
    if (nodeEntities[0] instanceof InternalComponent) {
        const component = nodeEntities[0]
        if (!component.component || !component.initialNodeEntities)
            return nodeEntities;
        return component.initialNodeEntities;
    }
    return nodeEntities
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



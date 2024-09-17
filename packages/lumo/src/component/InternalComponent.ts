import { AnyObject, MaybePromise } from "@rue/types";
import { EventHandler, NodeEntity, RenderFunction } from "../node/makeNode";
import { _NodePod } from "../node/NodePod";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { Provide } from "./provide";


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
export type ProviderComponentSetup<P extends never | AnyObject = never | AnyObject> = P extends never ? () => Component : (props: P, provide: Provide) => Component

// export type Slot<T> = T extends AnyObject ? InternalComponent<T> : NodeEntity | NodeEntity[]
export const COMPONENT = Symbol('publicComponent')
// export type PublicComponent<T extends undefined | AnyObject = undefined | AnyObject> = T extends undefined ? undefined :  T // contains anything in expose

export interface Component<T extends undefined | AnyObject = undefined | AnyObject> {
    component?: T;
    initialNodeEntities: NodeEntity
    mount: (
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    )=>void
}

export interface ComponentOutput<T extends undefined | AnyObject = undefined | AnyObject> {
    component?: T;
    initialNodeEntities: NodeEntity
}
export function Component<T extends AnyObject = AnyObject>(render: NodeEntity, exposedComponent?: T): ComponentOutput<T> {
    //TODO: make this more efficient?
    if (exposedComponent) {
        return {
            component: exposedComponent,
            initialNodeEntities: render
        }
    }
    const unnestedNodeEntities = unnestComponent(render)

    return {
        component: undefined,
        initialNodeEntities: unnestedNodeEntities
    }
}

export class InternalComponent<T extends undefined | AnyObject = undefined | AnyObject> implements Component {
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
    // const nodeEntities = component.initialNodeEntities!;
    if (nodeEntities.length > 1 || nodeEntities.length === 0)
        return nodeEntities;
    if (nodeEntities[0] instanceof InternalComponent) {
        const component = nodeEntities[0]
        if (!component.component || !component.initialNodeEntities)
            return nodeEntities;
        return unnestComponent(component.initialNodeEntities)
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



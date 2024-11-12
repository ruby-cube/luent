import { AnyObject } from "@rue/types";
import { NodeEntity } from "../node/makeNode";
import { _NodePod } from "../node/NodePod";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { protect } from "@rue/quarky";
import { MorphicRenderKit } from "../morphic/MorphicNode";



export type DOMNode = CharacterData | Element
// export type Props = {
//     [key: string]: any;
//     Slot?: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
// }

// export type RenderSlot<P extends any = undefined> =
//     P extends undefined ? () => NodeEntity | NodeEntity[]
//     : (props: P) => NodeEntity | NodeEntity[]

// export type Slot = NodeEntity | NodeEntity[]
export type ComponentSetup<P extends never | AnyObject = never | AnyObject> = P extends never ? () => Component : (setup?: P) => Component

// export type Slot<T> = T extends AnyObject ? InternalComponent<T> : NodeEntity | NodeEntity[]
export const COMPONENT = Symbol('publicComponent')
export type PublicComponent<T extends AnyObject = AnyObject> = T // contains anything in expose



export interface Component<T extends AnyObject | undefined = AnyObject | undefined> {
    exposedComponent?: T extends AnyObject ? PublicComponent<T> : undefined;
    renderedTemplate: NodeEntity | NodeEntity[];
    // morphicRenderKit?: MorphicRenderKit
}

export function expose<T>(publicComponent: T & Object): T {
    return protect(publicComponent);
}

type JSXTemplate = NodeEntity | NodeEntity[]

//TODO: accept a third paramenter for mountTeleported
// compiler macro to transform jsx template into render function
export function Component<T extends AnyObject | undefined = AnyObject | undefined>(exposedComponent: T, template: JSXTemplate): Component<T>
export function Component<T extends AnyObject | undefined = AnyObject | undefined>(template: JSXTemplate): Component<undefined>
export function Component<T extends AnyObject | undefined = AnyObject | undefined>(templateOrComponent: T | JSXTemplate, template?: JSXTemplate): Component<T extends AnyObject ? T : undefined> {
    const renderedTemplate = arguments.length === 2 ? template : templateOrComponent;
    const exposedComponent = arguments.length === 2 ? templateOrComponent : undefined;
    // const mountTeleported = arguments.length === 3 ? mountTeleported
    // const unnestedNodeEntities = unnestComponent(_render)
    // if (exposedComponent instanceof Object) {
    return {
        exposedComponent,
        renderedTemplate: unnestComponent(renderedTemplate),
    } as Component<T extends AnyObject ? T : undefined>
    // }
    // return {
    //     component: undefined,
    //     render: unnestedNodeEntities
    // } as Component<T extends AnyObject ? T : undefined>
}

export class InternalComponent<T extends AnyObject | undefined = AnyObject | undefined> {
    exposed?: T extends AnyObject ? PublicComponent<T> : undefined = undefined;
    initialNodeEntities: NodeEntity[] | null = null; // these are *initial* node entities. Node pods contain current nodes //TODO: add context type?? //QUESTION: should this be cleared or updated?

    mount(
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) { //TODO: what if a component's root elements is conditional or a dynamic list??
        const nodeEntities = this.initialNodeEntities!;
        if (!(parent instanceof Element))
            throw new Error("Parent cannot be a text node")
        for (const nodeEntity of nodeEntities) {
            mountNodeEntity(parent, nodeEntity, nodePod, fragment)
        }
    }
}


export function unnestComponent(nodeEntities: NodeEntity[]) {
    if (nodeEntities.length !== 1)
        return nodeEntities;
    if (nodeEntities[0] instanceof InternalComponent) {
        const component = nodeEntities[0]
        if (!component.exposed || !component.initialNodeEntities)
            return nodeEntities;
        return component.initialNodeEntities;
    }
    return nodeEntities
}
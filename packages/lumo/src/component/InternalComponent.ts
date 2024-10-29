import { AnyObject } from "@rue/types";
import { NodeEntity } from "../node/makeNode";
import { _NodePod } from "../node/NodePod";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { fromContext, popProvider, Provide, pushProvider, TypedKey } from "./provide";
import { protect } from "@rue/quarky";
import { MorphicRenderKit } from "../morphic/MorphicComponent";
import { ThisComponent } from "../$this";
import { getActiveDynamicNode } from "../dynamic/nodestack";


export interface Provider {
    entries?: Map<Symbol | string, any>;
    provider: Provider,
    root: Provider,
    global?: Provider,
    getFromGlobal?: <T, OPT extends "?" | undefined = undefined>(key: TypedKey<T>, optional?: "?")=> OPT extends "?" ? T | undefined : T
}

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
// export type ProviderComponentSetup<P extends never | AnyObject = never | AnyObject> = P extends never ? () => Component : (setup?: P, provide: Provide) => Component

// export type Slot<T> = T extends AnyObject ? InternalComponent<T> : NodeEntity | NodeEntity[]
export const COMPONENT = Symbol('publicComponent')
export type PublicComponent<T extends AnyObject = AnyObject> = T // contains anything in expose



export interface Component<T extends AnyObject | undefined = AnyObject | undefined> {
    publicComponent?: T extends AnyObject ? PublicComponent<T> : undefined;
    render: () => NodeEntity | NodeEntity[];
    morphicRenderKit?: MorphicRenderKit
}

export function expose<T>(publicComponent: T & Object): T {
    return protect(publicComponent);
}

type JSXTemplate = NodeEntity | NodeEntity[] | (() => NodeEntity | NodeEntity[])

//TODO: accept a third paramenter for mountTeleported
// compiler macro to transform jsx template into render function
export function Component<T extends AnyObject | undefined = AnyObject | undefined>(exposedComponent: T, render: JSXTemplate): Component<T>
export function Component<T extends AnyObject | undefined = AnyObject | undefined>(render: JSXTemplate): Component<undefined>
export function Component<T extends AnyObject | undefined = AnyObject | undefined>(renderOrComponent: T | JSXTemplate, render?: JSXTemplate): Component<T extends AnyObject ? T : undefined> {
    const _render = arguments.length === 2 ? render : renderOrComponent;
    const exposedComponent = arguments.length === 2 ? renderOrComponent : undefined;
    if (!(_render instanceof Function)) throw new Error('JSX template must be compiled into a render function')
    // const mountTeleported = arguments.length === 3 ? mountTeleported
    // const unnestedNodeEntities = unnestComponent(_render)
    // if (exposedComponent instanceof Object) {
    return {
        publicComponent: exposedComponent,
        render: _render,
    } as Component<T extends AnyObject ? T : undefined>
    // }
    // return {
    //     component: undefined,
    //     render: unnestedNodeEntities
    // } as Component<T extends AnyObject ? T : undefined>
}

export class InternalComponent<T extends AnyObject | undefined = AnyObject | undefined> implements Provider {
    component?: T extends AnyObject ? PublicComponent<T> : undefined = undefined;
    initialNodeEntities: NodeEntity[] | null = null; // these are *initial* node entities. Node pods contain current nodes //TODO: add context type?? //QUESTION: should this be cleared or updated?
    entries?: Map<Symbol | string, any>;

    initializeAsProvider() {
        if (this.entries) return;
        this.entries = new Map();
        this.getFromContext = fromContext.bind(this);
    }

    addEntry(key: string | symbol, value: any) {
        if (!this.entries) throw new Error('Entries must be initialized')
        this.entries!.set(key, value)
    }

    getFromContext?: <T, OPT extends "?" | undefined = undefined>(key: TypedKey<T>, optional?: "?")=> OPT extends "?" ? T | undefined : T
    getFromGlobal?: <T, OPT extends "?" | undefined = undefined>(key: TypedKey<T>, optional?: "?")=> OPT extends "?" ? T | undefined : T
    getFromApp?: <T, OPT extends "?" | undefined = undefined>(key: TypedKey<T>, optional?: "?")=> OPT extends "?" ? T | undefined : T

    instance?: ThisComponent

    createInstance(){
        const _this = this;
        const instance = this.instance = {
            get onCreated(){
                const dynamicNode = getActiveDynamicNode()
                if (dynamicNode.onCreated) return dynamicNode.onCreated;
                return dynamicNode.initializeOnCreatedHook()
            },
            get onDestroy(){
                const dynamicNode = getActiveDynamicNode()
                if (dynamicNode.onDestroy) return dynamicNode.onDestroy;
                return dynamicNode.initializeOnDestroyHook()
            },
            get getFromContext(){
                return _this.getFromContext;
            },
            get getFromApp(){
                return _this.root.getFromApp;
            },
            get getFromGlobal(){
                return _this.getFromContext;
            }
        }
        return instance;
    }

    root!: InternalComponent
    provider!: InternalComponent

    constructor(
        provider: InternalComponent | undefined,
        public global?: Provider,
        root?: InternalComponent,
    ) {
        this.root = root || this
        this.provider = provider || this
    }

    mount(
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) { //TODO: what if a component's root elements is conditional or a dynamic list??
        const nodeEntities = this.initialNodeEntities!;
        if (!(parent instanceof Element))
            throw new Error("Parent cannot be a text node")
        pushProvider(this.provider)
        for (const nodeEntity of nodeEntities) {
            mountNodeEntity(parent, nodeEntity, nodePod, fragment)
        }
        popProvider()
    }
}




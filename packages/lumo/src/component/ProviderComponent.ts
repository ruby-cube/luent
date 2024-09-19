import { AnyObject } from "@rue/types";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { _NodePod } from "../node/NodePod";
import { NodeEntity } from "../node/makeNode";
import { Component } from "./InternalComponent";
import { getCurrentProvider, popProvider, pushProvider } from "./provide";

export class Provider {
    entries: Map<Symbol | string, any> = new Map();

    constructor(
        public parent: ProviderComponent | null = null,
        public global: Provider = this
    ) {

    }
}

export class ProviderComponent<T extends undefined | AnyObject = undefined | AnyObject> extends Provider implements Component {
    component: T | undefined = undefined;
    initialNodeEntities: NodeEntity[] | null = null; // these are *initial* node entities. Node pods contain current nodes //TODO: add context type?? //QUESTION: should this be cleared or updated?
    // entries: Map<Symbol | string, any> = new Map();
    constructor(
        public parent: ProviderComponent | null,
        public global: Provider,
        public root?: ProviderComponent,
    ) {
        super(parent, global)
        this.root = root || this
    }

    mount(
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) { //TODO: what if a component's root elements is conditional or a dynamic list??
        const nodeEntities = this.initialNodeEntities!;
        if (!(parent instanceof Element))
            throw new Error("Parent cannot be a text node")
        pushProvider(this);
        for (const nodeEntity of nodeEntities) {
            mountNodeEntity(parent, nodeEntity, nodePod, fragment)
        }
        popProvider()
    }
}

export function getProviderComponent(functionName: string) {
    const component = getCurrentProvider()
    if (!component) {
        throw new Error(`${functionName} can only be called from a component setup`)
    }
    return component
}



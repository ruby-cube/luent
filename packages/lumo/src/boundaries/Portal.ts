import { Component, unnestComponent } from "../component/InternalComponent";
import { NodeEntity } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { _NodePod } from "../node/NodePod";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { setUpNodeEntities } from "../node/setUpNodeEntities";

export type MorphConfig = {}

let morphConfig: MorphConfig | undefined

export function getTransition() {
    const _morphConfig = morphConfig;
    morphConfig = undefined; // applies to only one conditional node. Once used, it is made undefined.
    return _morphConfig
}

export type PortalNodeInput = {
   to: string | Element,
}

export function createPortalNode(Slot: ()=>NodeEntity, input: PortalNodeInput) {
    const { to: container } = input
    if (!(Slot instanceof Function)) throw new Error('')
    const element = typeof container === "string" ? document.querySelector(container) : container;
    if (!element) throw new Error('Portal destination not found. Please check value of "to" attribute.')
    const nodePod = new _NodePod();
    nodePod.appendStaticNode(element) // serves as an indicator to append instead of prepend for dynamic updates

    const _nodeEntities = setUpNodeEntities(normalizeToArray(unnestComponent(Slot())), element, nodePod)
    mountNodeEntities(_nodeEntities, element)
    return Component(undefined);
}




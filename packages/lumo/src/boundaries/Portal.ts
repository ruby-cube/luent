import { component, unnestComponent } from "../component/InternalComponent";
import { NodeEntity } from "../node/makeNode";
import { isFunction, normalizeToArray } from "@rue/utils";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { setUpNodeEntities } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";

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
    if (!(isFunction(Slot))) throw new Error('')
    const element = typeof container === "string" ? document.querySelector(container) : container;
    if (!element) throw new Error('Portal destination not found. Please check value of "to" attribute.')
    const nodePod = new NodePod(); //TODO: do I append to outer node pod?? how does this work?
    nodePod.push(element) // serves as an indicator to append instead of prepend for dynamic updates

    const _nodeEntities = setUpNodeEntities(normalizeToArray(unnestComponent(Slot())), element, nodePod)
    mountNodeEntities(_nodeEntities, element)
    return component(undefined);
}




import { Component, unnestComponent } from "../component/InternalComponent";
import { NodeEntity } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { _NodePod } from "../node/NodePod";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { getContext, popContext, pushContext } from "../context/context-stack";

export type MorphConfig = {}

let morphConfig: MorphConfig | undefined

export function getTransition() {
    const _morphConfig = morphConfig;
    morphConfig = undefined; // applies to only one conditional node. Once used, it is made undefined.
    return _morphConfig
}



export function Portal(input: {
    to: string | Element,
    renderSlot: (() => NodeEntity | NodeEntity[]) | NodeEntity | NodeEntity[]
}) {
    const { renderSlot, to: container } = input
    if (!(renderSlot instanceof Function)) throw new Error('')
    const element = typeof container === "string" ? document.querySelector(container) : container;
    if (!element) throw new Error('Portal destination not found. Please check value of "to" attribute.')
    const nodePod = new _NodePod();
    nodePod.appendStaticNode(element) // serves as an indicator to append instead of prepend for dynamic updates

    const _nodeEntities = normalizeToArray(unnestComponent(renderSlot()))
    for (const nodeEntity of _nodeEntities) {
        mountNodeEntity(element, nodeEntity, nodePod)
    }
    return Component(undefined);
}




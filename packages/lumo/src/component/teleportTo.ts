//@ts-nocheck
import { normalizeToArray } from "@rue/utils";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { _NodePod } from "../node/NodePod";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { getProviderComponent, popProvider, pushProvider } from "./provide";
import { Component } from "./InternalComponent";

//TODO: teleportTo should be passed into Component() and be part of the render function so that provider is correct
export function teleportTo(container: string | Element, nodeEntities: (NodeEntity | NodeEntity[]) | (() => NodeEntity | NodeEntity[])) {
    return function mountTeleported() {
        const provider = getProviderComponent()
        const _container = typeof container === "string" ? document.querySelector(container) : container;
        if (!_container) throw new Error('teleportTo container not found. Please check selector')
        const nodePod = new _NodePod();
        nodePod.appendStaticNode(_container) // serves as an indicator to append instead of prepend for dynamic updates

        pushProvider(provider)
        const _nodeEntities = normalizeToArray(nodeEntities)
        for (const nodeEntity of _nodeEntities) {
            mountNodeEntity(_container, nodeEntity, nodePod)
        }
        popProvider()
    }
}




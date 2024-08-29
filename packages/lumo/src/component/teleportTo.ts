import { normalizeToArray } from "@rue/utils";
import { NodeEntity } from "../node/makeNode";
import { _NodePod } from "../node/NodePod";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { getCurrentComponent } from "./componentStack";
import { InternalComponent } from "./InternalComponent";

export function teleportTo(container: string | Element, nodeEntities: NodeEntity | NodeEntity[]) {
    const component = getCurrentComponent<InternalComponent>();
    if (!component) throw new Error(`teleportTo must be called from within ComponentSetup`)
    const _container = typeof container === "string" ? document.querySelector(container) : container;
    if (!_container) throw new Error('teleportTo container not found. Please check selector')
    const nodePod = new _NodePod();
    nodePod.appendStaticNode(_container) // serves as an indicator to append instead of prepend for dynamic updates
    const _nodeEntities = normalizeToArray(nodeEntities)
    for (const nodeEntity of _nodeEntities) {
        mountNodeEntity(component, _container, nodeEntity, nodePod)
    }
}
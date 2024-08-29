import { normalizeToArray } from "@rue/utils";
import { NodeEntity } from "../node/makeNode";
import { _NodePod } from "../node/NodePod";
import { popComponent, pushComponent } from "./componentStack";
import { getComponent, InternalComponent } from "./InternalComponent";
import { mountNodeEntity } from "../node/mountNodeEntity";

export function teleportTo(container: string | Element, nodeEntities: NodeEntity | NodeEntity[]) {
    const component = getComponent(teleportTo.name)
    const _container = typeof container === "string" ? document.querySelector(container) : container;
    if (!_container) throw new Error('teleportTo container not found. Please check selector')
    const nodePod = new _NodePod();
    nodePod.appendStaticNode(_container) // serves as an indicator to append instead of prepend for dynamic updates

    pushComponent(component)
    const _nodeEntities = normalizeToArray(nodeEntities)
    for (const nodeEntity of _nodeEntities) {
        mountNodeEntity(_container, nodeEntity, nodePod)
    }
    popComponent()
}
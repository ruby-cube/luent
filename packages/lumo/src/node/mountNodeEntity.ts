import { InternalComponent } from "../component/InternalComponent";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { mountElement } from "../element/mountElement";
import { NodeEntity } from "./makeNode";
import { _NodePod } from "./NodePod";
import { mountTextNode } from "./mountTextNode";
import { ListRenderKit } from "../list/ListRenderKit";
import { getProviderComponent, ProviderComponent } from "../component/ProviderComponent";

export function mountNodeEntity(
    parent: Element, //TODO: parent is as optional as fragment I think...
    nodeEntity: NodeEntity,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
) {
    if (nodeEntity instanceof Element) { // Element type from Web API
        mountElement(parent, nodeEntity, nodePod, fragment)
    }
    else if (nodeEntity instanceof InternalComponent || nodeEntity instanceof ProviderComponent) { //TODO: make a shared prototype
        nodeEntity.mount(parent, nodePod, fragment)
    }
    else if (nodeEntity instanceof ListRenderKit) { // may or may not be dynamic, depending on data
        nodeEntity.mount(parent, nodePod, fragment);
    }
    else if (nodeEntity instanceof Array) {
        const series = new ConditionalRenderSeries(
            nodeEntity,
            nodeEntity[0].type,
            () => new ConditionalRenderKit('else', () => [], 'create', getProviderComponent(mountNodeEntity.name))
        )
        series.mount(parent, nodePod, fragment)
    }
    else {
        mountTextNode(parent, nodeEntity, nodePod, fragment)
    }
}
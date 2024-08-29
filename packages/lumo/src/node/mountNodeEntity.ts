import { InternalComponent } from "../component/InternalComponent";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { mountElement } from "../element/mountElement";
import { ListRenderKit } from "../list/iterate_over";
import { setUpNodeList } from "../list/setUpNodeList";
import { NodeEntity } from "./makeNode";
import { _NodePod } from "./NodePod";
import { mountTextNode } from "./mountTextNode";

export function mountNodeEntity(
    component: InternalComponent,
    parent: Element, //TODO: parent is as optional as fragment I think...
    nodeEntity: NodeEntity,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[],
) {
    if (nodeEntity instanceof Element) { // Element type from Web API
        mountElement(parent, nodeEntity, nodePod, fragment)
    }
    else if (nodeEntity instanceof InternalComponent) {
        nodeEntity.mount(component, parent, nodePod, fragment)
        // if (componentsToUnmount) componentsToUnmount.push(nodeEntity);
    }
    else if (nodeEntity instanceof ListRenderKit) { // this may or may not be dynamic, depending on data
        setUpNodeList(component, parent, nodeEntity, nodePod, fragment, componentsToUnmount);
    }
    else if (nodeEntity instanceof Array) {
        // conditional series
        const series = new ConditionalRenderSeries(nodeEntity, nodeEntity[0].type, () => new ConditionalRenderKit('else', () => []))
        series.mount(component, parent, nodePod, fragment)
    }
    else {
        mountTextNode(parent, nodeEntity, nodePod, fragment)
    }
}
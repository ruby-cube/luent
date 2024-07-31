import { InternalComponent } from "../component/component";
import { setUpComponent } from "../component/setUpComponent";
import { buildConditionalSeries } from "../conditional/$if";
import { setUpConditionalSeries } from "../conditional/setUpConditionalSeries";
import { setUpConditionalShowSeries } from "../conditional/showIf";
import { mountElement } from "../element/mE";
import { ListRenderKit } from "../list/forEachIn";
import { setUpNodeList } from "../list/setUpNodeList";
import { NodeEntity } from "./makeNode";
import { setUpTextNode } from "./mE";
import { _NodePod } from "./NodePod";

export function setUpNodeEntity(
    component: InternalComponent,
    parent: Element, //TODO: parent is as optional as fragment I think...
    nodeEntity: NodeEntity,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[],
) {
    if (nodeEntity instanceof Element) { // from Web API
        mountElement(parent, nodeEntity, nodePod, fragment)
    }
    else if (nodeEntity instanceof InternalComponent) {
        setUpComponent(component, parent, nodeEntity, nodePod, fragment)
        if (componentsToUnmount) componentsToUnmount.push(nodeEntity);
    }
    else if (nodeEntity instanceof ListRenderKit) { // this may or may not be dynamic, depending on data
        setUpNodeList(component, parent, nodeEntity, nodePod, fragment, componentsToUnmount);
    }
    else if (nodeEntity instanceof Array) {
        // conditional series
        const series = buildConditionalSeries(nodeEntity);
        if (series.type === 'create' || series.type === 'activate') {
            setUpConditionalSeries(component, parent, series, nodePod, fragment)
        }
        else if (series.type === 'show') {
            setUpConditionalShowSeries(component, parent, series, nodePod, fragment)
        }
    }
    // else if (nodeEntity instanceof ConditionalRenderKit){
    //     const series = buildConditionalSeries([nodeEntity]);
    //     setUpConditionalSeries(component, parent, series, nodePod, fragment)
    // }
    else {
        setUpTextNode(parent, nodeEntity, nodePod, fragment)
    }
}
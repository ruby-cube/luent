import { InternalComponent } from "../component/component";
import { setUpComponent } from "../component/setUpComponent";
import { buildConditionalSeries } from "../conditional/$if";
import { setUpConditionalDisplay } from "../conditional/setUpConditionalDisplay";
import { setUpConditionalMount } from "../conditional/setUpConditionalMount";
import { mountElement, setUpTextNode,  } from "../element/mE";
import { ListRenderKit } from "../list/forEachIn";
import { setUpNodeList } from "../list/setUpNodeList";
import { NodeEntity } from "./makeNode";
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
            setUpConditionalMount(component, parent, series, nodePod, fragment)
        }
        else if (series.type === 'show') {
            setUpConditionalDisplay(component, parent, series, nodePod, fragment)
        }
    }
    // else if (nodeEntity instanceof ConditionalRenderKit){
    //     const series = buildConditionalSeries([nodeEntity]);
    //     setUpConditionalMount(component, parent, series, nodePod, fragment)
    // }
    else {
        setUpTextNode(parent, nodeEntity, nodePod, fragment)
    }
}
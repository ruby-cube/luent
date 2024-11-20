import { InternalComponent } from "../component/InternalComponent";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { mountElement } from "../element/mountElement";
import { NodeEntity } from "./makeNode";
import { _NodePod } from "./NodePod";
import { mountTextNode, setUpTextNode } from "./mountTextNode";
import { ListRenderKit } from "../iteratives/ListRenderKit";
import { MorphicRenderKit } from "../morphic/MorphicNode";
import { getContext } from "../context/context-stack";

// node kits:
// - text ion
// - element
// - array (for conditional series)



// node entity:
// - textNode
// - element
// - 

export function mountNodeEntities(
    nodeEntities: NodeEntity[],
    parent: Element, //TODO: parent is as optional as fragment I think...
    fragment?: DocumentFragment,
){
    for (const nodeEntity of nodeEntities){
        mountNodeEntity(nodeEntity, parent, fragment)
    }
}


function mountNodeEntity(
    nodeEntity: NodeEntity,
    parent: Element, //TODO: parent is as optional as fragment I think...
    fragment?: DocumentFragment,
) {
    if (nodeEntity instanceof Element) { // Element type from Web API
        mountElement(parent, nodeEntity, fragment)
    }
    else if (nodeEntity instanceof InternalComponent || nodeEntity instanceof MorphicRenderKit || nodeEntity instanceof ListRenderKit) { //TODO: make a shared prototype
        nodeEntity.mount(parent,fragment)
    }
    // else if (nodeEntity instanceof ListRenderKit) { // may or may not be dynamic, depending on data
    //     nodeEntity.mount(parent, nodePod, fragment);
    // }
    else if (nodeEntity instanceof Array) { //TODO: This needs to be cached for reactivation
        const series = new ConditionalRenderSeries(
            nodeEntity,
            () => new ConditionalRenderKit('else', () => [], 'create', getContext(), [])
        )
        series.mount(parent, fragment)
    }
    else {
        mountTextNode(nodeEntity, parent, fragment)
    }
}



// creating conditional series
// 
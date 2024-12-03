import { InternalComponent } from "../component/InternalComponent";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { mountElement } from "../element/mountElement";
import { _NodePod } from "./NodePod";
import { mountTextNode, setUpTextNode } from "./mountTextNode";
import { ListRenderKit } from "../iteratives/ListRenderKit";
import { MorphicRenderKit } from "../morphic/MorphicNode";
import { NodeKit } from "./setUpNodeEntities";

// node kits:
// - text ion
// - element
// - array (for conditional series)



// node entity:
// - textNode
// - element
// - 

export function mountNodeEntities(
    nodeEntities: NodeKit[],
    parent: Element, //TODO: parent is as optional as fragment I think...
    fragment?: DocumentFragment,
){
    // console.log('start--------------', nodeEntities)
    for (const nodeEntity of nodeEntities){
        mountNodeEntity(nodeEntity, parent, fragment)
    }
    // console.log('end--------------', nodeEntities)
}


function mountNodeEntity(
    nodeEntity: NodeKit,
    parent: Element, //TODO: parent is as optional as fragment I think...
    fragment?: DocumentFragment,
) {
    if (nodeEntity instanceof Element) { // Element type from Web API
        mountElement(parent, nodeEntity, fragment)
    }
    else if (nodeEntity instanceof InternalComponent 
        || nodeEntity instanceof MorphicRenderKit 
        || nodeEntity instanceof ListRenderKit
        || nodeEntity instanceof ConditionalRenderSeries
    ) { //TODO: make a shared prototype
       
        nodeEntity.mount(parent,fragment)
    }
    // else if (nodeEntity instanceof ListRenderKit) { // may or may not be dynamic, depending on data
    //     nodeEntity.mount(parent, nodePod, fragment);
    // }

    else {
        mountTextNode(nodeEntity, parent, fragment)
    }
}



// creating conditional series
// 
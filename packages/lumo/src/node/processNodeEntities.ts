import { DOMNode, InternalComponent } from "../component/InternalComponent";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { validateStandAloneConditional } from "../conditional/ConditionalSeries";
import { getContext } from "../context/context-stack";
import { setUpElement } from "../element/mountElement";
import { ListRenderKit } from "../iteratives/ListRenderKit";
import { MorphicRenderKit } from "../morphic/MorphicNode";
import { NodeEntity } from "./makeNode";
import { setUpTextNode } from "./mountTextNode";
import { _NodePod } from "./NodePod";

export type NodeKit = DOMNode | InternalComponent | ListRenderKit | ConditionalRenderSeries | MorphicRenderKit

export function processNodeEntities(
    nodeEntities: NodeEntity[],
    parent: Element, //TODO: parent is as optional as fragment I think...
    nodePod: _NodePod,
) {
    const nodeKits: NodeKit[] = []
    for (let i = 0; i < nodeEntities.length; i++) {
        let nodeEntity = nodeEntities[i];
        if (nodeEntity instanceof ConditionalRenderKit) {
            validateStandAloneConditional(nodeEntity, nodeEntities, i); //TODO: don't I need to do this for all render function outputs?
            nodeEntity = [nodeEntity]
        }
        nodeKits.push(setUpNodeEntity(nodeEntity, parent, nodePod))
    }
    return nodeKits;
}

export function setUpNodeEntity(
    nodeEntity: NodeEntity,
    parent: Element, //TODO: parent is as optional as fragment I think...
    nodePod: _NodePod,
) {
    if (nodeEntity instanceof Element) { // Element type from Web API
        return setUpElement(nodeEntity, nodePod)
    }
    else if (nodeEntity instanceof InternalComponent) {
        return nodeEntity;
    }
    else if (nodeEntity instanceof ListRenderKit || nodeEntity instanceof MorphicRenderKit) { // may or may not be dynamic, depending on data
        nodeEntity.setUp(parent, nodePod);
    }
    else if (nodeEntity instanceof Array) {
        const series = new ConditionalRenderSeries(
            nodeEntity,
            () => new ConditionalRenderKit('else', () => [], 'create', getContext(), [])
        )
        series.setUp(parent, nodePod)
    }
    else {
        return setUpTextNode(nodeEntity, nodePod)
    }
    throw new Error('Invalid nodeEntity')
}
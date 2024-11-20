import { normalizeToArray } from "@rue/utils";
import { Component, ComponentSetup, InternalComponent, unnestComponent } from "../component/InternalComponent";
import { DynamicNode } from "../dynamic/DynamicNode";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "../dynamic/nodestack";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { mountNodeEntities, mountNodeEntity } from "../node/mountNodeEntity";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { mountConditional } from "../conditional/ConditionalRenderSeries";
import { getContext, getCurrentContext, popContext, pushContext } from "../context/context-stack";
import { NodeContext } from "../context/Context";
import { AppContext } from "../context/provide";
import { processNodeEntities } from "../node/processNodeEntities";

export function MorphicNode(switchMap: { [key: string]: RenderFunction }) {
    return function $MorphicNode({ as: initialKey, preserve }: {
        as: string,
        preserve?: true
    }) {
        const morphicRenderKit = new MorphicRenderKit(
            switchMap,
            initialKey,
            !!preserve,
            getContext(),
            getActiveDynamicNode()
        )

        return {
            exposedComponent: {
                as(key: string) {
                    if (morphicRenderKit.activeKey === key) return;
                    morphicRenderKit.render(key)
                }
            },
            renderedTemplate: morphicRenderKit
        } satisfies Component
    }
}


export class MorphicRenderKit {

    // nodePodSwitchMap: Map<string, _NodePod> = new Map()

    constructor(
        public switchMap: { [key: string]: RenderFunction },
        public activeKey: string,
        public preserve: boolean,
        public context: NodeContext | AppContext,
        public parentDynamicNode: DynamicNode
    ) {
        if (preserve) {
            this.renderedKeys = new Set()
            this.renderedKeys.add(activeKey);
        }
    }

    render!: (key: string) => void

    renderedKeys?: Set<string>;

    // initialNodeEntities!: NodeEntity[]

    dynamicNode!: DynamicNode
    dynamicNodePod!: _DynamicNodePod

    mount(
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) {
        const nodeEntities = processNodeEntities(normalizeToArray(unnestComponent(this.switchMap[this.activeKey]())), parent, nodePod);
        const dynamicPod = this.dynamicNodePod = nodePod.appendDynamicPod();
        const _nodePod = dynamicPod.appendNodePod()
        const dynamicNode = this.dynamicNode = makeDynamicNode(_nodePod)
        pushContext(this.context)
        dynamicNode.mount(function renderMorphicNode() {
            mountNodeEntities(nodeEntities, parent, fragment)
        })
        popContext()

        this.render = function updateMorphicComponent(key: string) {
            this.activeKey = key;

            pushDynamicNode(this.parentDynamicNode)
            // remove previous
            this.deactivateForm()

            // render new form
            pushContext(this.context)
            this.activateForm(key, parent, _nodePod)
            popContext()

            popDynamicNode()
        }
    }

    deactivateForm() {
        const dynamicNode = this.dynamicNode
        if (this.preserve) {
            //TODO:
            dynamicNode.destroy()
        }
        else {
            dynamicNode.destroy()
        }
    }

    activateForm(key: string, parent: Element, nodePod: _NodePod) {
        const dynamicNode = this.dynamicNode = makeDynamicNode(nodePod)
        const _this = this
        if (this.preserve && this.renderedKeys?.has(key)) {
            dynamicNode.reactivate(function activateMorphicForm() {
                const nodeEntities = normalizeToArray(unnestComponent(_this.switchMap[key]()))
                mountConditional(nodePod, parent, _this.dynamicNodePod, nodeEntities)
            })
        } else {
            dynamicNode.mount(function reactivateMorphicForm() {
                const nodeEntities = normalizeToArray(unnestComponent(_this.switchMap[key]()))
                mountConditional(nodePod, parent, _this.dynamicNodePod, nodeEntities)
            })
        }
    }
}




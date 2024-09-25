import { normalizeToArray } from "@rue/utils";
import { Component, ComponentSetup } from "../component/InternalComponent";
import { popProvider, pushProvider } from "../component/provide";
import { getProviderComponent, ProviderComponent } from "../component/ProviderComponent";
import { DynamicNode } from "../dynamic/DynamicNode";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "../dynamic/nodestack";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { mountConditional } from "../conditional/ConditionalRenderSeries";

export function MorphicComponent(switchMap: { [key: string]: RenderFunction }) {
    return function $MorphicNode({ as: initialKey, preserve }: {
        as: string,
        preserve?: true
    }) {
        const morphicRenderKit = new MorphicRenderKit(
            switchMap,
            initialKey,
            !!preserve,
            getProviderComponent(),
            getActiveDynamicNode()
        )

        return {
            morphicRenderKit,
            component: {
                render(key: string) {
                    if (morphicRenderKit.activeKey === key) return;
                    morphicRenderKit.morph(key)
                }
            },
            initialNodeEntities: switchMap[initialKey]()
        } satisfies Component & {
            morphicRenderKit: MorphicRenderKit
        }
    }
}

function createMorphicComponent() {

}

export class MorphicRenderKit {

    // nodePodSwitchMap: Map<string, _NodePod> = new Map()

    constructor(
        public switchMap: { [key: string]: RenderFunction },
        public activeKey: string,
        public preserve: boolean,
        public component: ProviderComponent,
        public parentDynamicNode: DynamicNode
    ) {
        if (preserve) {
            this.renderedKeys = new Set()
            this.renderedKeys.add(activeKey);
        }
    }

    morph!: (key: string) => void

    renderedKeys?: Set<string>;

    initialNodeEntities!: NodeEntity[]

    dynamicNode!: DynamicNode
    dynamicNodePod!: _DynamicNodePod

    mount(
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) {
        const nodeEntities = this.initialNodeEntities!;
        const dynamicPod = this.dynamicNodePod = nodePod.appendDynamicPod();
        const _nodePod = dynamicPod.appendNodePod()
        const dynamicNode = this.dynamicNode = makeDynamicNode(this.preserve, _nodePod)
        pushProvider(this.component)
        dynamicNode.activate(function renderMorphicNode() {
            for (const nodeEntity of nodeEntities) {
                mountNodeEntity(parent, nodeEntity, _nodePod, fragment)
            }
        })
        popProvider()

        this.morph = function updateMorphicComponent(key: string) {
            this.activeKey = key;

            pushDynamicNode(this.parentDynamicNode)
            // remove previous
            this.deactivateForm()

            // render new form
            pushProvider(this.component)
            this.activateForm(key, parent, _nodePod)
            popProvider()

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
        const dynamicNode = this.dynamicNode = makeDynamicNode(this.preserve, nodePod)
        const _this = this
        if (this.preserve && this.renderedKeys?.has(key)) {
            dynamicNode.reactivate(function activateMorphicForm() {
                const nodeEntities = normalizeToArray(_this.switchMap[key]())
                for (const nodeEntity of nodeEntities) {
                    mountConditional(nodePod, parent, _this.dynamicNodePod, nodeEntities)
                }
            })
        } else {
            dynamicNode.activate(function reactivateMorphicForm(){
                const nodeEntities = normalizeToArray(_this.switchMap[key]())
                for (const nodeEntity of nodeEntities) {
                    mountConditional(nodePod, parent, _this.dynamicNodePod, nodeEntities)
                }
            })
        }
    }
}




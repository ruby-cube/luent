import { InternalComponent } from "../component/InternalComponent";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { DynamicNode, getActiveDynamicNode, NULLISH_DYNAMIC_NODE, popDynamicNode, pushDynamicNode } from "../dynamic/DynamicNode";
import { LifecycleHook as DynamicLifecycleHook } from "../dynamic/lifecycle";
import { NodeEntity } from "../node/makeNode";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { _DynamicNodePod, _NodePod, NULLISH_NODE_POD } from "../node/NodePod";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { ConditionalSeries } from "./ConditionalSeries";
import { hidePrevConditionalNodes, showConditionalNodes } from "./toggledisplay";
import { watchForRender } from "../watch/watchForRender";
import { areShallowEqualArrays } from "@rue/muonic";
import { popComponent, pushComponent } from "../component/componentStack";
import { LifecycleHook } from "../component/lifecycle";



export class ConditionalRenderSeries extends ConditionalSeries {
    declare statements: ConditionalRenderKit[];
    dynamicNodes: DynamicNode[] = []
    storeDynamicNode(dynamicNode: DynamicNode, index: number) {
        if (__DEV__ && this.dynamicNodes[index] !== NULLISH_DYNAMIC_NODE && this.dynamicNodes[index] !== undefined)
            throw new Error('Dynamic Node already exists at this index')
        this.dynamicNodes[index] = dynamicNode;
    }

    private _dynamicNodePod!: _DynamicNodePod;

    initDynamicNodePod(dynamicNodePod: _DynamicNodePod) {
        if (this._dynamicNodePod) {
            if (__DEV__) throw new Error('dynamicNodePod can only be initialized once')
            return;
        }
        this._dynamicNodePod = dynamicNodePod;

        // populate dynamic node pod
        // 'show/hide' node pods are aggregated to the front of the dynamicNodePod
        // 'create' and 'mount' node pods share the last node pod of dynamicNodePod
        // This way, we can mount 'create' and 'mount' efficiently without having 
        // to traverse empty 'create' and 'mount' node pods when looking for previous sibling
        let hasCreateOrMount = false;
        for (const kit of this.statements) {
            if (kit.type === 'show')
                dynamicNodePod.appendNodePod()
            else
                hasCreateOrMount = true;
        }

        if (hasCreateOrMount) {
            dynamicNodePod.appendNodePod()
        }
        console.log('how many', dynamicNodePod.length)
    }

    get dynamicNodePod() {
        if (__DEV__ && !this._dynamicNodePod)
            throw new Error('Dynamic Node Pod has not been initialized')
        return this._dynamicNodePod;
    }

    getNodePod(index: number) {
        const nodePodIndex = this.toNodePodIndex(index)
        return this.dynamicNodePod[nodePodIndex]
    }

    replaceNodePod(index: number, nodePod: _NodePod) {
        const nodePodIndex = this.toNodePodIndex(index)
        this.dynamicNodePod.replaceNodePod(nodePodIndex, nodePod)
    }

    private toNodePodIndex(index: number) {
        const kit = this.statements[index]
        const nodePodIndex = kit.nodePodIndex;
        if (nodePodIndex === undefined)
            return this.dynamicNodePod.length - 1
        return nodePodIndex;
    }

    constructor(
        statements: ConditionalRenderKit[],
        public type: 'create' | 'show' | 'mount',
        makeElseKit: () => ConditionalRenderKit
    ) {
        super(statements, makeElseKit);
    }

    mount(
        component: InternalComponent,
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) {
        // evaluate conditions and render
        const { $conditions, activeIndex } = this.evaluateConditions()
        const dynamicPod = nodePod.appendDynamicPod();
        const series = this;
        this.initDynamicNodePod(dynamicPod)

        const parentDynamicNode = getActiveDynamicNode();
        if (__DEV__ && !parentDynamicNode) 
            throw new Error('No active dynamic node. This should never happen since the root component is a dynamic node')
        this.appendConditional(activeIndex, component, parent, fragment)

        // set up watcher for updates
        watchForRender($conditions, updateConditional, { once: true })

        function updateConditional(newValue: boolean[], oldValue: boolean[]) {
            console.log("[ updating conditional ]")
            if (areShallowEqualArrays(newValue, oldValue)) return;

            pushComponent(component)
            pushDynamicNode(parentDynamicNode!)
            component.emit(LifecycleHook.BEFORE_UPDATE)

            // evaluate conditions

            // render and add/remove node pods
            series.deactivateConditional()
            const { $conditions, activeIndex } = series.evaluateConditions();
            series.activateConditional(activeIndex, component, parent)

            // set up for next update
            watchForRender($conditions, updateConditional, { once: true })

            component.emit(LifecycleHook.UPDATED)
            popComponent()
            popDynamicNode()
        }
    }

    render(index: number) {
        return this.statements[index].renderConditional()
    }

    appendConditional(
        activeIndex: number,
        component: InternalComponent,
        parent: Element,
        fragment?: DocumentFragment,
    ) {
        const series = this;
        const nodePod = this.getNodePod(activeIndex)
        const dynamicNode = makeDynamicNode(nodePod)
        dynamicNode.activate(function renderConditional() {
            const nodeEntities = series.render(activeIndex)
            // append to dom (through existing fragment if any) and node pod
            for (const nodeEntity of nodeEntities) {
                mountNodeEntity(component, parent, nodeEntity, nodePod, fragment)
            }
        })
        series.storeDynamicNode(dynamicNode, activeIndex)
        dynamicNode.emit(DynamicLifecycleHook.MOUNTED) //TODO: change to activated
    }

    deactivateConditional() {
        const activeIndex = this.activeIndex;
        console.log('deactivateConditional', activeIndex)
        if (activeIndex == null)
            throw new Error('Cannot deactivateConditional if there is no active conditional')
        const activationType = this.statements[activeIndex].type
        if (activationType === 'show') {
            hidePrevConditionalNodes(this.dynamicNodePod, activeIndex);
        }
        else {
            const dynamicNode = this.dynamicNodes[activeIndex]
            console.log('dynamicNode', dynamicNode)
            // if (dynamicNode){
                if (activationType === 'create') {
                    console.log('activationType', activationType)
                    this.dynamicNodes[activeIndex] = NULLISH_DYNAMIC_NODE; // release reference
                    this.replaceNodePod(activeIndex, NULLISH_NODE_POD)
                    dynamicNode.destroy()
                    console.log("DESTROY")
                }
                else if (activationType === 'mount') {
                    dynamicNode.unmount()
                }
            // }
        }
    }

    activateConditional(
        activeIndex: number,
        component: InternalComponent,
        parent: Element
    ) {
        const activationType = this.statements[activeIndex].type
        const series = this;
        const dynamicNodePod = this.dynamicNodePod
        // set up new conditional pod if needed
        const _nodePod = dynamicNodePod[activeIndex]
        const nodePod = _nodePod === NULLISH_NODE_POD || !_nodePod ? new _NodePod() : _nodePod;

        let dynamicNode = this.dynamicNodes[activeIndex]
        console.log("dynamicNode?", dynamicNode)
        console.log("dynamicNode is nullish?", dynamicNode === NULLISH_DYNAMIC_NODE)
        if (dynamicNode === undefined || dynamicNode === NULLISH_DYNAMIC_NODE) {
            dynamicNode = makeDynamicNode(nodePod);
            dynamicNode.activate(function renderConditionalUpdate() {
                const nodeEntities = series.render(activeIndex)
                mountConditional(nodePod, component, parent, dynamicNodePod, nodeEntities);
            })
            series.storeDynamicNode(dynamicNode, activeIndex)
        }
        else {
            dynamicNode.activate(function updateConditional() {
                const nodeEntities = series.render(activeIndex);
                if (activationType === 'show') {
                    showConditionalNodes(component, parent, dynamicNodePod, activeIndex, nodeEntities)
                }
                else {
                    series.replaceNodePod(activeIndex, nodePod);
                    mountConditional(nodePod, component, parent, dynamicNodePod, nodeEntities)
                }
            })
        }
        dynamicNode.emit(DynamicLifecycleHook.MOUNTED) //TODO: change to activated
    }

}

export function mountConditional(nodePod: _NodePod, component: InternalComponent, parent: Element, dynamicPod: _DynamicNodePod, nodeEntities: NodeEntity[]) {
    const fragment = new DocumentFragment();

    for (const nodeEntity of nodeEntities) {
        mountNodeEntity(component, parent, nodeEntity, nodePod, fragment) //TODO: pass in index in case it's in a list?
    }

    let prevSibling = dynamicPod.prevNode;
    if (prevSibling && prevSibling === parent) parent.append(fragment) //for teleport
    else if (prevSibling) prevSibling.after(fragment)
    else parent.prepend(fragment)
}

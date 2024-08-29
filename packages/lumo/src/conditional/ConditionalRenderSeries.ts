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
    private dynamicNodes: DynamicNode[] = []
    private storeDynamicNode(dynamicNode: DynamicNode, index: number) {
        if (__DEV__ && this.dynamicNodes[index] !== NULLISH_DYNAMIC_NODE && this.dynamicNodes[index] !== undefined)
            throw new Error('Dynamic Node already exists at this index')
        this.dynamicNodes[index] = dynamicNode;
    }

    private _dynamicNodePod!: _DynamicNodePod;

    private initDynamicNodePod(dynamicNodePod: _DynamicNodePod) {
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

    private get dynamicNodePod() {
        if (__DEV__ && !this._dynamicNodePod)
            throw new Error('Dynamic Node Pod has not been initialized')
        return this._dynamicNodePod;
    }

    private getNodePod(index: number) {
        const nodePodIndex = this.toNodePodIndex(index)
        return this.dynamicNodePod[nodePodIndex]
    }

    private replaceNodePod(index: number, nodePod: _NodePod) {
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

    component: InternalComponent

    constructor(
        statements: ConditionalRenderKit[],
        public type: 'create' | 'show' | 'mount',
        makeElseKit: () => ConditionalRenderKit
    ) {
        super(statements, makeElseKit);
        this.component = statements[0].component;
    }

    mount(
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) {
        // evaluate conditions and render
        const { $conditions, activeIndex } = this.evaluateConditions()
        const dynamicPod = nodePod.appendDynamicPod();
        const series = this;
        const component = this.component
        this.initDynamicNodePod(dynamicPod)

        const parentDynamicNode = getActiveDynamicNode();
        if (__DEV__ && !parentDynamicNode)
            throw new Error('No active dynamic node. This should never happen since the root component is a dynamic node')
        this.appendConditional(activeIndex, parent, fragment)

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
            series.activateConditional(activeIndex, parent)

            // set up for next update
            watchForRender($conditions, updateConditional, { once: true })

            component.emit(LifecycleHook.AFTER_UPDATE)
            popComponent()
            popDynamicNode()
        }
    }

    private render(index: number) {
        return this.statements[index].renderConditional()
    }

    private appendConditional(
        activeIndex: number,
        parent: Element,
        fragment?: DocumentFragment,
    ) {
        const series = this;
        const nodePod = this.getNodePod(activeIndex)
        const activationType = this.statements[activeIndex].type
        const component = this.component
        const preserve = activationType === 'create' ? false : true;
        const dynamicNode = makeDynamicNode(preserve, nodePod)
        pushComponent(component)
        dynamicNode.activate(function renderConditional() {
            const nodeEntities = series.render(activeIndex)
            // append to dom (through existing fragment if any) and node pod
            for (const nodeEntity of nodeEntities) {
                mountNodeEntity(parent, nodeEntity, nodePod, fragment)
            }
        })
        popComponent()
        dynamicNode.emit(DynamicLifecycleHook.ON_ACTIVATED)
        series.storeDynamicNode(dynamicNode, activeIndex)
    }

    private deactivateConditional() {
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
                console.log("ON_DESTROY")
            }
            else if (activationType === 'mount') {
                dynamicNode.unmount()
            }
            // }
        }
    }

    private activateConditional(
        activeIndex: number,
        parent: Element
    ) {
        const activationType = this.statements[activeIndex].type
        const preserve = activationType === 'create' ? false: true;
        const series = this;
        const component = this.component
        const dynamicNodePod = this.dynamicNodePod
        // set up new conditional pod if needed
        const _nodePod = dynamicNodePod[activeIndex]
        const nodePod = _nodePod === NULLISH_NODE_POD || !_nodePod ? new _NodePod() : _nodePod;

        pushComponent(component)
        let dynamicNode = this.dynamicNodes[activeIndex]
        if (dynamicNode === undefined || dynamicNode === NULLISH_DYNAMIC_NODE) {
            dynamicNode = makeDynamicNode(preserve, nodePod);
            dynamicNode.activate(function renderConditionalUpdate() {
                const nodeEntities = series.render(activeIndex)
                mountConditional(nodePod, parent, dynamicNodePod, nodeEntities);
            })
            dynamicNode.emit(DynamicLifecycleHook.ON_ACTIVATED)
            series.storeDynamicNode(dynamicNode, activeIndex)
        }
        else {
            dynamicNode.activate(function updateConditional() {
                const nodeEntities = series.render(activeIndex);
                if (activationType === 'show') {
                    showConditionalNodes( parent, dynamicNodePod, activeIndex, nodeEntities)
                }
                else {
                    series.replaceNodePod(activeIndex, nodePod);
                    mountConditional(nodePod, parent, dynamicNodePod, nodeEntities)
                }
            })
            dynamicNode.emit(DynamicLifecycleHook.ON_ACTIVATED)
        }
        popComponent()
    }

}

export function mountConditional(
    nodePod: _NodePod,
    parent: Element,
    dynamicPod: _DynamicNodePod,
    nodeEntities: NodeEntity[]
) {
    const fragment = new DocumentFragment();

    for (const nodeEntity of nodeEntities) {
        mountNodeEntity(parent, nodeEntity, nodePod, fragment) //TODO: pass in index in case it's in a list?
    }

    let prevSibling = dynamicPod.prevNode;
    if (prevSibling && prevSibling === parent) parent.append(fragment) //for teleport
    else if (prevSibling) prevSibling.after(fragment)
    else parent.prepend(fragment)
}



// function nullNodeRefValues(nodePod: _NodePod, components: InternalComponent[]) {
//     nodePod.forEachNode(node => {
//         const ref = getNodeRef(node);
//         if (ref && ref.o()) ref.setValue(undefined)
//     })
//     for (const component of components) {
//         const ref = getNodeRef(component.component);
//         if (ref && ref.o()) ref.setValue(null)
//     }
// }
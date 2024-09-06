import { InternalComponent } from "../component/InternalComponent";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { DynamicNode, getActiveDynamicNode, isMountPhase, markMountPhase, NULLISH_DYNAMIC_NODE, popDynamicNode, pushDynamicNode, unmarkMountPhase } from "../dynamic/DynamicNode";
import { LifecycleHook as DynamicLifecycleHook } from "../dynamic/lifecycle";
import { NodeEntity } from "../node/makeNode";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { _DynamicNodePod, _NodePod, NULLISH_NODE_POD } from "../node/NodePod";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { ConditionalSeries } from "./ConditionalSeries";
import { hidePrevConditionalNodes, showConditionalNodes } from "./toggledisplay";
import { setUpUpdateHooks, watchForRender } from "../watch/watchForRender";
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
        // // evaluate conditions and render
        // const { $conditions, activeIndex } = this.evaluateConditions()
        // const dynamicPod = nodePod.appendDynamicPod();
        // const series = this;
        // const component = this.component
        // this.initDynamicNodePod(dynamicPod)

        // const parentDynamicNode = getActiveDynamicNode();
        // if (__DEV__ && !parentDynamicNode)
        //     throw new Error('No active dynamic node. This should never happen since the root component is a dynamic node')
        // pushComponent(component)
        // this.appendConditional(activeIndex, parent, fragment)
        // popComponent()

        // // set up watcher for updates
        // pushComponent(component) // must pushComponent separately from appendConditional
        // watchForRender($conditions, updateConditional, { once: true })
        // popComponent()

        // function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        //     if (areShallowEqualArrays(newValue, oldValue)) return;
        //     console.log("update conditional")

        //     pushDynamicNode(parentDynamicNode!)
        //     // component.emit(LifecycleHook.BEFORE_UPDATE)

        //     // (1)
        //     series.deactivateConditional()

        //     // (2)
        //     const { $conditions, activeIndex } = series.evaluateConditions();

        //     // (3)
        //     pushComponent(component)
        //     series.activateConditional(activeIndex, parent)
        //     popComponent()

        //     // (4) set up for next update
        //     pushComponent(component)
        //     watchForRender($conditions, updateConditional, { once: true })
        //     popComponent()


        //     // component.emit(LifecycleHook.ON_UPDATED)
        //     popDynamicNode()
        //     console.log('update conditional done')
        // }


        // evaluate conditions and render
        const $conditions = this.genConditionsSignal()
        const activeIndex = this.evaluateConditions()
        const dynamicPod = nodePod.appendDynamicPod();
        const series = this;
        const component = this.component
        this.initDynamicNodePod(dynamicPod)

        const _nodePod = this.getNodePod(activeIndex)
        const activationType = this.statements[activeIndex].type
        const preserve = activationType === 'create' ? false : true;
        const dynamicNode = makeDynamicNode(preserve, _nodePod)

        dynamicNode.activate(function renderConditional() {
            pushComponent(component)
            series.appendConditional(activeIndex, parent, fragment)
            popComponent()

            // set up watcher for updates
            //NOTE: Must watchForRender inside conditional dynamicNode (rather than parent dynamic node) so that $condition gets cleaned up with flask disposal, preventng memory leak
            watchForRender($conditions, updateConditional, { once: true, __devName: 'mount conditional' })
        })
        this.storeDynamicNode(dynamicNode, activeIndex)


        const parentDynamicNode = getActiveDynamicNode()
        if (!parentDynamicNode) throw new Error('No dynamicNode :( This should never happen since root component is a dynamic node')


        function updateConditional(newValue: boolean[], oldValue: boolean[]) {
            if (areShallowEqualArrays(newValue, oldValue)) return;
            console.log("update conditional")
            pushDynamicNode(parentDynamicNode!)

            // (1)
            series.deactivateConditional()

            // (2)
            const activeIndex = series.evaluateConditions();

            // (3)
            pushComponent(component)
            series.activateConditional(activeIndex, parent)
            popComponent()

            // (4)
            setUpUpdateHooks(component)

            // (5) set up for next update
            const dynamicNode = series.dynamicNodes[activeIndex]
            pushDynamicNode(dynamicNode)
            watchForRender($conditions, updateConditional, { once: true, __devName: updateConditional.name })
            popDynamicNode()
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
        // const series = this;
        // const nodePod = this.getNodePod(activeIndex)
        // const activationType = this.statements[activeIndex].type
        // const preserve = activationType === 'create' ? false : true;
        // const dynamicNode = makeDynamicNode(preserve, nodePod)
        // dynamicNode.activate(function renderConditional() {
        //     const nodeEntities = series.render(activeIndex)
        //     // append to dom (through existing fragment if any) and node pod
        //     if (preserve) markMountPhase()
        //     for (const nodeEntity of nodeEntities) {
        //         mountNodeEntity(parent, nodeEntity, nodePod, fragment)
        //     }
        //     if (preserve) unmarkMountPhase()
        // })
        // series.storeDynamicNode(dynamicNode, activeIndex)

        const nodePod = this.getNodePod(activeIndex)
        const activationType = this.statements[activeIndex].type
        const preserve = activationType === 'create' ? false : true;
        const nodeEntities = this.render(activeIndex)
        // append to dom (through existing fragment if any) and node pod
        if (preserve) markMountPhase()
        for (const nodeEntity of nodeEntities) {
            mountNodeEntity(parent, nodeEntity, nodePod, fragment)
        }
        if (preserve) unmarkMountPhase()
    }

    private deactivateConditional() {
        const activeIndex = this.activeIndex;
        if (activeIndex == null)
            throw new Error('Cannot deactivateConditional if there is no active conditional')
        const activationType = this.statements[activeIndex].type
        if (activationType === 'show') {
            hidePrevConditionalNodes(this.dynamicNodePod, activeIndex);
        }
        else {
            const dynamicNode = this.dynamicNodes[activeIndex]
            if (activationType === 'create') {
                this.dynamicNodes[activeIndex] = NULLISH_DYNAMIC_NODE; // release reference
                this.replaceNodePod(activeIndex, NULLISH_NODE_POD)
                dynamicNode.destroy()
            }
            else if (activationType === 'mount') {
                dynamicNode.unmount()
            }
        }
    }

    private activateConditional(
        activeIndex: number,
        parent: Element
    ) {

        // const activationType = this.statements[activeIndex].type
        // const preserve = activationType === 'create' ? false : true;
        // const series = this;
        // const dynamicNodePod = this.dynamicNodePod
        // // set up new conditional pod if needed
        // const _nodePod = dynamicNodePod[activeIndex]
        // const nodePod = _nodePod === NULLISH_NODE_POD || !_nodePod ? new _NodePod() : _nodePod;

        // let dynamicNode = this.dynamicNodes[activeIndex]
        // if (dynamicNode === undefined || dynamicNode === NULLISH_DYNAMIC_NODE) {
        //     dynamicNode = makeDynamicNode(preserve, nodePod);
        //     dynamicNode.activate(function renderConditionalUpdate() {
        //         const nodeEntities = series.render(activeIndex)
        //         if (preserve) markMountPhase()
        //         mountConditional(nodePod, parent, dynamicNodePod, nodeEntities);
        //         if (preserve) unmarkMountPhase()
        //     })
        //     series.storeDynamicNode(dynamicNode, activeIndex)
        // }
        // else {
        //     dynamicNode.reactivate(function updateConditional() {
        //         const nodeEntities = series.render(activeIndex);
        //         if (preserve) markMountPhase()
        //         if (activationType === 'show') {
        //             showConditionalNodes(parent, dynamicNodePod, activeIndex, nodeEntities)
        //         }
        //         else {
        //             series.replaceNodePod(activeIndex, nodePod);
        //             mountConditional(nodePod, parent, dynamicNodePod, nodeEntities)
        //         }
        //         if (preserve) unmarkMountPhase()
        //     })
        // }

        //---------

        const activationType = this.statements[activeIndex].type
        const preserve = activationType === 'create' ? false : true;
        const series = this;
        const dynamicNodePod = this.dynamicNodePod
        // set up new conditional pod if needed
        const _nodePod = dynamicNodePod[activeIndex]
        const nodePod = _nodePod === NULLISH_NODE_POD || !_nodePod ? new _NodePod() : _nodePod;

        let dynamicNode = this.dynamicNodes[activeIndex]
        if (dynamicNode === undefined || dynamicNode === NULLISH_DYNAMIC_NODE) {
            dynamicNode = makeDynamicNode(preserve, nodePod);
            dynamicNode.activate(function renderConditionalUpdate() {
                const nodeEntities = series.render(activeIndex)
                if (preserve) markMountPhase()
                mountConditional(nodePod, parent, dynamicNodePod, nodeEntities);
                if (preserve) unmarkMountPhase()
            })
            series.storeDynamicNode(dynamicNode, activeIndex)
        }
        else {
            dynamicNode.reactivate(function updateConditional() {
                const nodeEntities = series.render(activeIndex);
                if (preserve) markMountPhase()
                if (activationType === 'show') {
                    showConditionalNodes(parent, dynamicNodePod, activeIndex, nodeEntities)
                }
                else {
                    series.replaceNodePod(activeIndex, nodePod);
                    mountConditional(nodePod, parent, dynamicNodePod, nodeEntities)
                }
                if (preserve) unmarkMountPhase()
            })
        }
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
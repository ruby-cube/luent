import { InternalComponent } from "../component/InternalComponent";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { DynamicNode, isMountPhase, markMountPhase, NULLISH_DYNAMIC_NODE, unmarkMountPhase } from "../dynamic/DynamicNode";
import { LifecycleHook as DynamicLifecycleHook } from "../dynamic/lifecycle";
import { NodeEntity } from "../node/makeNode";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { _DynamicNodePod, _NodePod, NULLISH_NODE_POD } from "../node/NodePod";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { ConditionalSeries } from "./ConditionalSeries";
import { hidePrevConditionalNodes, showConditionalNodes } from "./toggledisplay";
import { watch } from "../watch/watchAndPreserve";
import { areShallowEqualArrays, Phase } from "../../../quarky/src";
import { getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "../dynamic/nodestack";
import { popContext, pushContext, Context } from "../context/context-stack";
import { getPhasicNode, PhasicNode } from "../transition/PhaseChange";



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

    context: Context

    phasicNode?: PhasicNode

    constructor(
        statements: ConditionalRenderKit[],
        public type: 'create' | 'show' | 'mount',
        makeElseKit: () => ConditionalRenderKit
    ) {
        super(statements, makeElseKit);
        const context = this.context = statements[0].context;
        this.phasicNode = getPhasicNode(context);
    }

    mount(
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) {
        const parentDynamicNode = getActiveDynamicNode()

        // evaluate conditions and render
        const $conditions = this.getConditionsIon()
        const activeIndex = this.evaluateConditions()
        const dynamicPod = nodePod.appendDynamicPod();
        const series = this;
        const phasicNode = this.phasicNode

        this.initDynamicNodePod(dynamicPod)

        const _nodePod = this.getNodePod(activeIndex)
        const activationType = this.statements[activeIndex].type
        const preserve = activationType === 'create' ? false : true;
        const dynamicNode = makeDynamicNode(preserve, _nodePod)

        dynamicNode.activate(function renderConditional() {
            series.appendConditional(activeIndex, parent, fragment)
        })
        this.storeDynamicNode(dynamicNode, activeIndex)

        console.log('setting conditional', $conditions)
        let transitionInStartTime = 0;
        let transitionOutStartTime = 0;
        let transitioningOutIndex: number | undefined;
        let skipTransitionIn = false;

        // set up watcher for updates
        watch($conditions, function updateConditional(newValue: boolean[], oldValue: boolean[]) {
            console.log("update conditional")
            if (areShallowEqualArrays(newValue, oldValue)) return;

            // (2)
            const prevIndex = series.activeIndex;
            const activeIndex = series.evaluateConditions();
            const transitionNodes = series.statements[activeIndex].transitionNodes

            // (0) Pause previous transition
            if (transitionInStartTime) {
                if (phasicNode) {
                    phasicNode.endPhaseIn()
                    phasicNode.pause('in', transitionInStartTime);
                }
                for (const node of transitionNodes) {
                    node.cancelTransitionIn();
                    node.pause('in', transitionInStartTime)
                }
                transitionInStartTime = 0;

            } else if (transitionOutStartTime) {
                if (activeIndex === transitioningOutIndex) {
                    if (phasicNode) {
                        phasicNode.endPhaseOut()
                        phasicNode.pause('out', transitionOutStartTime);
                    }
                    for (const node of transitionNodes) {
                        node.cancelTransitionOut();
                        node.pause('out', transitionOutStartTime)
                    }
                    transitionOutStartTime = 0;
                    transitioningOutIndex = undefined;

                    // transition in right away (since it doesn't need to be activated since it was never removed)
                }
                else {
                    skipTransitionIn = true;

                    // (3)
                    activateConditional()
                }

                // (4)
                transitionConditionalIn()

                return;
            }

            // (1) Transition out
            transitionOutStartTime = new Date().getTime();
            transitioningOutIndex = prevIndex;

            let nodeCount = transitionNodes.length + (phasicNode ? 1 : 0)

            for (const node of transitionNodes) {
                node.transitionOut(node => {
                    if () node.remove() // QUESTION: should this be before or after deactivateConditional? //TODO: only remove if 'create/destroy'
                    nodeCount--
                    if (nodeCount === 0) afterTransitionOut()
                });
            }
            if (phasicNode) phasicNode.phaseOut(() => {
                nodeCount--
                if (nodeCount === 0) afterTransitionOut()
            })

            function afterTransitionOut() {
                transitionOutStartTime = 0;
                series.deactivateConditional()

                if (!skipTransitionIn) {
                    // (3)
                    activateConditional()

                    // (4)
                    transitionConditionalIn()
                }
                else {
                    skipTransitionIn = false;
                }
            }

            function activateConditional() {
                pushDynamicNode(parentDynamicNode!)
                series.activateConditional(activeIndex, parent)
                popDynamicNode()
            }

            function transitionConditionalIn() {
                let nodeCount = transitionNodes.length + (phasicNode ? 1 : 0)
                transitionInStartTime = new Date().getTime()
                for (const node of transitionNodes) {
                    node.transitionIn(endTransition);
                }
                if (phasicNode) {
                    phasicNode.phaseIn(endTransition)
                }
                function endTransition() {
                    nodeCount--
                    if (nodeCount === 0) {
                        transitionInStartTime = 0;
                    }
                }
            }
        }, {
            // retrack: true,
            phase: Phase.RENDER,
            __devName: 'mount conditional'
        })



        // // set up watcher for updates
        // watch($conditions, function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        //     console.log("update conditional")
        //     if (areShallowEqualArrays(newValue, oldValue)) return;

        //     // (1)
        //     series.deactivateConditional()

        //     // (2)
        //     const activeIndex = series.evaluateConditions();

        //     // (3)
        //     pushDynamicNode(parentDynamicNode!)
        //     series.activateConditional(activeIndex, parent)
        //     popDynamicNode()

        // }, {
        //     // retrack: true,
        //     phase: Phase.RENDER,
        //     __devName: 'mount conditional'
        // })
    }

    private render(index: number) {
        return this.statements[index].renderConditional()
    }

    private appendConditional(
        activeIndex: number,
        parent: Element,
        fragment?: DocumentFragment,
    ) {
        const nodePod = this.getNodePod(activeIndex)
        const activationType = this.statements[activeIndex].type
        const preserve = activationType === 'create' ? false : true;
        try {
            pushContext(this.context)
            const nodeEntities = this.render(activeIndex)
            // append to dom (through existing fragment if any) and node pod
            if (preserve) markMountPhase()
            for (const nodeEntity of nodeEntities) {
                mountNodeEntity(parent, nodeEntity, nodePod, fragment)
            }
            if (preserve) unmarkMountPhase()
        }
        finally {
            popContext()
        }
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
                try {
                    pushContext(series.context)
                    const nodeEntities = series.render(activeIndex)
                    if (preserve) markMountPhase()
                    mountConditional(nodePod, parent, dynamicNodePod, nodeEntities);
                    if (preserve) unmarkMountPhase()
                }
                finally {
                    popContext()
                }
            })
            series.storeDynamicNode(dynamicNode, activeIndex)
        }
        else {
            dynamicNode.reactivate(function updateConditional() {
                try {
                    pushContext(series.context)
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
                }
                finally {
                    popContext()
                }
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
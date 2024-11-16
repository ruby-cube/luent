import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { DynamicNode, isMountPhase, markMountPhase, NULLISH_DYNAMIC_NODE, unmarkMountPhase } from "../dynamic/DynamicNode";
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
import { TransitionNode } from "../transition/TransitionNode";



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

    phasicNode?: TransitionNode

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
        let entranceStateTime = 0;
        let exitStateTime = 0;
        let outgoingIndex: number | undefined;
        let newTransitionIn: (() => void) | undefined;
        let prevOutgoingNodes: TransitionNode[];
        let prevIncomingNodes: TransitionNode[];

        // set up watcher for updates
        watch($conditions, function updateConditional(newValue: boolean[], oldValue: boolean[]) {
            console.log("update conditional==================", newValue, oldValue)
            if (areShallowEqualArrays(newValue, oldValue)) return;

            const prevIndex = series.activeIndex!;
            const activeIndex = series.evaluateConditions();
            if (prevIndex === activeIndex) {
                return;
            }
            const outgoingNodes = series.statements[prevIndex].transitionNodes
            const incomingNodes = series.statements[activeIndex].transitionNodes
            const shouldTransitionOut = phasicNode || outgoingNodes.length

            // (0) Pause previous transition
            if (entranceStateTime) {
                if (phasicNode) {
                    phasicNode.cancel('in');
                    phasicNode.pause('in', entranceStateTime);
                }
                for (const node of prevIncomingNodes) {
                    node.cancel('in')
                    node.pause('in', entranceStateTime)
                }
                entranceStateTime = 0;
                prevIncomingNodes = [...incomingNodes];
                prevOutgoingNodes = [...outgoingNodes]
            } else if (exitStateTime) {
                if (activeIndex === outgoingIndex) {
                    if (phasicNode) {
                        phasicNode.cancel('out');
                        phasicNode.pause('out', entranceStateTime);
                    }
                    for (const node of prevOutgoingNodes) {
                        node.cancel('out')
                        node.pause('out', entranceStateTime)
                    }
                    exitStateTime = 0;
                    outgoingIndex = undefined;

                    // (4)
                    // transition in right away (since it doesn't need to be activated since it was never removed)
                    if (phasicNode || incomingNodes.length)
                        transitionConditionalIn()

                    prevIncomingNodes = [...incomingNodes];
                    prevOutgoingNodes = [];
                }
                else {
                    newTransitionIn = () => {
                        // (3)
                        activateConditional() //TODO: this shouldn't happen until after transitionend

                        // (4)
                        if (phasicNode || incomingNodes.length)
                            transitionConditionalIn()
                    }
                    prevIncomingNodes = [...incomingNodes]
                }
                return;
            }
            else {
                prevIncomingNodes = [...incomingNodes]
                prevOutgoingNodes = [...outgoingNodes]
            }


            if (!shouldTransitionOut) {
                try {
                    series.deactivateConditional(prevIndex)
                }
                catch (err) {
                    if (__DEV__) console.error(err)
                    // if deactivate fails, we don't activate the new conditional
                    return;
                }

                // (3)
                activateConditional()

                // (4)
                if (phasicNode || incomingNodes.length) {
                    transitionConditionalIn()
                }
            }
            else { // (1) Transition out
                exitStateTime = new Date().getTime();
                outgoingIndex = prevIndex;
                const cleanups: (() => void)[] = []

                let nodeCount = outgoingNodes.length

                if (phasicNode) {
                    phasicNode.transitionOut(afterTransitionOut)
                }
                else {
                    for (const node of outgoingNodes) {
                        node.transitionOut(afterTransitionOut);
                    }
                }

                function afterTransitionOut(cleanup?: () => void) {
                    if (phasicNode) {
                        for (const node of outgoingNodes) {
                            if (node.animatingOut || node.transitioningOut) {
                                node.cancel('out')
                            }
                        }
                    }
                    else {
                        nodeCount--;
                    }

                    if (cleanup) cleanups.push(cleanup)

                    if (phasicNode || nodeCount === 0) {
                        exitStateTime = 0;

                        for (const cleanup of cleanups) {
                            cleanup()
                        }
                        console.log('unmount:', prevIndex)
                        series.deactivateConditional(prevIndex)

                        if (!newTransitionIn) {
                            // (3)
                            console.log('mount (after transition out)')
                            activateConditional()

                            // (4)
                            if (phasicNode || incomingNodes.length) {
                                console.log('transition IN')
                                transitionConditionalIn()
                            }

                            // prevIncomingNodes = [...incomingNodes];
                        }
                        else {
                            console.log('replace transition IN')
                            newTransitionIn();
                            newTransitionIn = undefined;
                        }

                        outgoingNodes.length = 0; // clear array for next transition nodes
                    }
                }
            }

            function activateConditional() {
                incomingNodes.length = 0; // clear array for next transition nodes
                pushDynamicNode(parentDynamicNode!)
                console.log('MOUNT:', activeIndex)
                series.activateConditional(activeIndex, parent)
                popDynamicNode()
            }

            function transitionConditionalIn() {
                let nodeCount = incomingNodes.length + (phasicNode ? 1 : 0)
                entranceStateTime = new Date().getTime()
                for (const node of incomingNodes) {
                    node.transitionIn(endTransition);
                }
                if (phasicNode) {
                    phasicNode.transitionIn(endTransition)
                }
                function endTransition() {
                    nodeCount--
                    console.log('nodeCount', nodeCount)
                    if (nodeCount === 0) {
                        entranceStateTime = 0;
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

    private deactivateConditional(index: number) {
        const activationType = this.statements[index].type
        if (activationType === 'show') {
            hidePrevConditionalNodes(this.dynamicNodePod, index);
        }
        else {
            const dynamicNode = this.dynamicNodes[index]
            if (activationType === 'create') {
                this.dynamicNodes[index] = NULLISH_DYNAMIC_NODE; // release reference
                this.replaceNodePod(index, NULLISH_NODE_POD)
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
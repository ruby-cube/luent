import { getWithoutTracking, ReactiveSignal } from "@rue/muonic"
import { ConditionalSeries, watchForRenderAndPreserve } from "./$if"
import { DOMNode, InternalComponent, popComponent, pushComponent } from "../component/component"
import { _DynamicNodePod, _NodePod } from "../node/NodePod"
import { watchForRender } from "../reactivity/watchForRender"
import { isEqual } from "@rue/utils"
import { LifecycleHook } from "../component/lifecycle"
import { NodeEntity } from "../node/makeNode"
import { mountConditional } from "./setUpConditionalMount"
import { setUpNodeEntity } from "../node/setUpNodeEntity"
import { getCurrentUpdateCycle } from "@rue/muonic/UpdateCycle"

export function setUpConditionalDisplay(
    component: InternalComponent,
    parent: Element,
    series: ConditionalSeries,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    // componentsToUnmount?: InternalComponent[],
) {

    const { $conditions, activeIndex } = series.evaluateConditions()
    const dynamicPod = nodePod.appendDynamicPod();

    let statementCount = series.conditionalKits.length;
    while (statementCount--) {
        dynamicPod.appendNodePod()
    }

    const initialNodeEntities = series.render(activeIndex);

    // append to dom and node pod
    for (const nodeEntity of initialNodeEntities) {
        const nodePod = dynamicPod[activeIndex];
        setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount)
    }

    // set up watcher for updates
    const _watchForRender = component.preserve ? watchForRenderAndPreserve : watchForRender

    _watchForRender($conditions, updateConditional, { once: true })

    let prevIndex = activeIndex;

    const updateCycle = getCurrentUpdateCycle()
    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        if (updateCycle === getCurrentUpdateCycle()){
            console.warn("Dev Note: This warning is here to test to see if updateCycle for initiation is ever the same as updating the conditional. If this warning shows, that means this is not useless code")
            return;
        }
        if (isEqual(newValue, oldValue)) return;
        const { $conditions, activeIndex } = series.evaluateConditions();

        pushComponent(component)
        component.emit(LifecycleHook.BEFORE_UPDATE)
        hidePrevConditionalNodes(dynamicPod, prevIndex);
        const nodeEntities = series.render(activeIndex);
        showConditionalNodes(component, parent, dynamicPod, activeIndex, nodeEntities)
        component.emit(LifecycleHook.UPDATED)

        _watchForRender($conditions, updateConditional, { once: true })
        popComponent()

        prevIndex = activeIndex;
    }
}

function hidePrevConditionalNodes(dynamicPod: _DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    const components = nodePod.componentsToUnmount;
    hideDOMNodes(nodePod)
}


function showConditionalNodes(component: InternalComponent, parent: Element, dynamicPod: _DynamicNodePod, activeIndex: number, nodeEntities: NodeEntity[]) {
    const nodePod = dynamicPod[activeIndex];
    if (nodePod.length === 0) { // lazy render
        mountConditional(nodePod, component, parent, dynamicPod, nodeEntities)
    }
    showDOMNodes(nodePod) //QUESTION: Not sure if this should be in an else block... is it necessary to set display on newly rendered nodes?
}



const showIfMap: WeakMap<DOMNode, string> = new WeakMap()

export function hideDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        if (node instanceof HTMLElement) {
            showIfMap.set(node, node.style.display)
            node.style.display = 'none'
        }
        else if (node instanceof CharacterData) { // TextNode
            showIfMap.set(node, node.data)
            node.data = ""
        }
        else if (node instanceof SVGAElement) {

        }
        else if (node instanceof MathMLElement) {

        }
        else if (__DEV__) {
            console.warn(`Unhandled node type ${node}`)
        }
    })
}

function showDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        if (node instanceof HTMLElement) {
            const display = showIfMap.get(node)
            if (display === undefined) {
                node.style.removeProperty('display');
            }
            else {
                node.style.display = display
            }
        }
        else if (node instanceof SVGAElement) {
            //TODO:
        }
        else if (node instanceof MathMLElement) {
            //TODO:
        }
        else if (node instanceof CharacterData) {
            const text = showIfMap.get(node)
            if (text === undefined) throw new Error("previous text info missing")
            node.data = text;
        }
        else {
            console.warn(`Unhandled node type ${node}`)
        }
    })
}


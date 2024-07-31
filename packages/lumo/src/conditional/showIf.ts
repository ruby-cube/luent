import { getWithoutTracking, ReactiveSignal } from "@rue/muonic"
import { ConditionalSeries, watchForRenderAndPreserve } from "./$if"
import { DOMNode, InternalComponent, popComponent, pushComponent } from "../component/component"
import { _DynamicNodePod, _NodePod } from "../node/NodePod"
import { watchForRender } from "../reactivity/watchForRender"
import { isEqual } from "@rue/utils"
import { LifecycleHook } from "./lifecycle"
import { NodeEntity } from "../node/makeNode"
import { mountConditional } from "./setUpConditionalSeries"
import { setUpNodeEntity } from "../node/setUpNodeEntity"

const showIfMap: WeakMap<DOMNode, string> = new WeakMap()

export function hideDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        if (node instanceof Element) {
            showIfMap.set(node, node.style.display)
            node.style.display = 'none'
        }
        else { // TextNode
            showIfMap.set(node, node.data)
            node.data = ""
        }
    })
}

function showDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        if (node instanceof Element) {
            const display = showIfMap.get(node)
            if (display === undefined) {
                node.style.removeProperty('display');
            }
            else {
                node.style.display = display
            }
        }
        else {
            const text = showIfMap.get(node)
            if (text === undefined) throw new Error("previous text info missing")
            node.data = text;
        }
    })
}







export function setUpConditionalShowSeries(
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

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        console.log("show if!")
        if (isEqual(newValue, oldValue)) return;
        const { $conditions, activeIndex } = series.evaluateConditions();
        
        pushComponent(component)
        component.emit(LifecycleHook.BEFORE_UPDATE)
        hidePrevConditionalNodes(dynamicPod, activeIndex);
        const nodeEntities = series.render(activeIndex);
        showConditionalNodes(component, parent, dynamicPod, activeIndex, nodeEntities)
        component.emit(LifecycleHook.UPDATED)

        _watchForRender($conditions, updateConditional, { once: true })
        popComponent()
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




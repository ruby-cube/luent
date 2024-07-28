import { getWithoutTracking, ReactiveSignal } from "@rue/muonic"
import { ConditionalSeries, watchForRenderAndPreserve } from "./$if"
import { DOMNode, InternalComponent, popComponent, pushComponent } from "./component"
import { _DynamicNodePod, _NodePod } from "./NodePod"
import { mountConditional, setUpNodeEntity } from "./mE"
import { watchForRender } from "./watchForRender"
import { isEqual } from "@rue/utils"
import { LifecycleHook } from "./lifecycle"
import { NodeEntity } from "./makeNode"

const showIfMap: WeakMap<DOMNode, string> = new WeakMap()

export function hideDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        if (node instanceof HTMLElement) {
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
        if (node instanceof HTMLElement) {
            const display = showIfMap.get(node)
            if (display === undefined) throw new Error("previous display info missing")
            node.style.display = display
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
    parent: HTMLElement,
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
        if (isEqual(newValue, oldValue)) return;
        const { $conditions, activeIndex } = series.evaluateConditions();

        component.emit(LifecycleHook.BEFORE_UPDATE)
        hidePrevConditionalNodes(dynamicPod, activeIndex);
        const nodeEntities = series.render(activeIndex);
        showConditionalNodes(component, parent, dynamicPod, activeIndex, nodePod)
        component.emit(LifecycleHook.UPDATED)

        // pushComponent(component)
        _watchForRender($conditions, updateConditional, { once: true })
        // popComponent()
    }
}

function hidePrevConditionalNodes(dynamicPod: _DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    const components = nodePod.componentsToUnmount;
    hideDOMNodes(nodePod)
}


function showConditionalNodes(component: InternalComponent, parent: HTMLElement, dynamicPod: _DynamicNodePod, activeIndex: number, nodeEntities: NodeEntity[]) {
    const nodePod = dynamicPod[activeIndex];
    if (nodePod.length === 0) { // lazy render
        mountConditional(nodePod, component, parent, dynamicPod, nodeEntities)
    }
    showDOMNodes(nodePod) //QUESTION: Not sure if this should be in an else block... is it necessary to set display on newly rendered nodes?
}




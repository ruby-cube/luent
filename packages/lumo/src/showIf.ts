import { getWithoutTracking, ReactiveSignal } from "@rue/muonic"
import { ConditionalSeries } from "./$if"
import { DOMNode, InternalComponent, popComponent, pushComponent } from "./component"
import { _DynamicNodePod, _NodePod } from "./NodePod"
import { normalizeToArray, renderAndAppendConditionalNodePod, setUpNodeEntity } from "./mE"
import { RenderConditional, watchForRenderAndPreserve } from "./mountIf"
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







export function setUpConditionalShowEntity(
    component: InternalComponent,
    parent: HTMLElement,
    conditionalSeries: ConditionalSeries,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    // componentsToUnmount?: InternalComponent[],
) {
    const { conditionalKits, $conditions } = conditionalSeries;

    const activeIndex = conditionalSeries.activeIndex;

    const dynamicPod = nodePod.appendDynamicPod();

    // const _conditionalKits: {
    //     $condition?: ReactiveSignal<boolean>;
    //     nodePod: _NodePod;
    //     renderConditional: () => NodeEntity[];
    // }[] = []

    for (let i = 0; i < conditionalKits.length; i++) {
        // const { renderConditional, $condition } = conditionalKits[i];
        const nodePod = dynamicPod.appendNodePod()
        // _conditionalKits.push({ $condition, nodePod, renderConditional });
    }

    const initialNodeEntities = normalizeToArray(conditionalKits[activeIndex].renderConditional())

    for (const nodeEntity of initialNodeEntities) {
        // append to dom and node pod
        const nodePod = dynamicPod[activeIndex];
        setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount)
    }
    // if (dynamicPod && _dynamicPod) dynamicPod.includeComponents(_dynamicPod.activeComponents) // aggregate components to unmount

    //    0                               1    2
    // [[node, [maybe dynamic pod]], [ ], [ ]] --- dynamic pod
    //  |                                 |
    //  active pod                   inactive pod
    //
    // 
    // [activeKit, kit, kit] --- conditionalKits
    //

    // set up watcher for updates
    const _watchForRender = component.preserve ? watchForRenderAndPreserve : watchForRender

    _watchForRender($conditions, updateConditional, { once: true })

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        if (isEqual(newValue, oldValue)) return;

        // const conditions: ReactiveSignal<boolean>[] = []
        for (let i = 0; i < conditionalKits.length; i++) {
            const kit = conditionalKits[i]
            const { renderConditional, $condition } = kit;
            // if ($condition) conditions.push($condition);
            if ($condition && getWithoutTracking($condition) || !$condition) {
                component.emit(LifecycleHook.BEFORE_UPDATE)
                hidePrevConditionalNodes(dynamicPod, activeIndex);
                showConditionalNodes(component, parent, dynamicPod, renderConditional, i)
                component.emit(LifecycleHook.UPDATED)
                break;
            }
        }
        const $conditions = conditionalSeries.evaluateConditions();

        pushComponent(component)
        _watchForRender($conditions, updateConditional, { once: true })
        popComponent()
    }
}

function hidePrevConditionalNodes(dynamicPod: _DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    const components = nodePod.componentsToUnmount;
    hideDOMNodes(nodePod)
}


function showConditionalNodes(component: InternalComponent, parent: HTMLElement, dynamicPod: _DynamicNodePod, renderConditional: RenderConditional, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    if (nodePod.length === 0) {
        renderAndAppendConditionalNodePod(nodePod, component, parent, dynamicPod, renderConditional) // lazy render
    }
    showDOMNodes(nodePod) //QUESTION: Not sure if this should be in an else block... is it necessary to set display on newly rendered nodes?
}




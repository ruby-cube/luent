import { areShallowEqualArrays, getWithoutTracking, isShallowEqual, ReactiveSignal } from "@rue/muonic"
import { DOMNode, InternalComponent} from "../component/InternalComponent"
import { _DynamicNodePod, _NodePod } from "../node/NodePod"
import { watchForRender } from "../watch/watchForRender"
import { LifecycleHook } from "../component/lifecycle"
import { NodeEntity } from "../node/makeNode"
import { mountNodeEntity } from "../node/mountNodeEntity"
import { ConditionalRenderSeries, mountConditional } from "./ConditionalRenderSeries"
import { popComponent, pushComponent } from "../component/componentStack"

export function setUpConditionalDisplay(
    component: InternalComponent,
    parent: Element,
    series: ConditionalRenderSeries,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    // componentsToUnmount?: InternalComponent[],
) {
    const { $conditions, activeIndex } = series.evaluateConditions()
    const dynamicPod = nodePod.appendDynamicPod();

    let statementCount = series.statements.length;
    while (statementCount--) {
        dynamicPod.appendNodePod()
    }

    
    const initialNodeEntities = series.render(activeIndex);

    // append to dom and node pod
    for (const nodeEntity of initialNodeEntities) {
        const nodePod = dynamicPod[activeIndex];
        mountNodeEntity(component, parent, nodeEntity, nodePod, fragment)
    }

    // set up watcher for updates

    watchForRender($conditions, updateConditional, { once: true })

    let prevIndex = activeIndex;

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {

        if (areShallowEqualArrays(newValue, oldValue)) return;
        const { $conditions, activeIndex } = series.evaluateConditions();

        pushComponent(component)
        component.emit(LifecycleHook.BEFORE_UPDATE)

        hidePrevConditionalNodes(dynamicPod, prevIndex);
        const nodeEntities = series.render(activeIndex);
        showConditionalNodes(component, parent, dynamicPod, activeIndex, nodeEntities)
        
        
        watchForRender($conditions, updateConditional, { once: true })

        component.emit(LifecycleHook.UPDATED)
        popComponent()

        prevIndex = activeIndex;
    }
}

export function hidePrevConditionalNodes(dynamicPod: _DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    hideDOMNodes(nodePod)
}


export function showConditionalNodes(component: InternalComponent, parent: Element, dynamicPod: _DynamicNodePod, activeIndex: number, nodeEntities: NodeEntity[]) {
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


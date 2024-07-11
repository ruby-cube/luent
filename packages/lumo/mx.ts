import { AnyObject } from "@rue/types";
import { SetKey, Signal } from "../muonic/useSignalize";
import { DOMNode, getCurrentComponent, InternalComponent } from "./component";
import { watchForUpdate } from "./watchForUpdate";
import { $, hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal";
import { getWithoutTracking } from "../muonic/DependencyTracker";
import { ListRenderKit } from "./mxsFor";
import { LifecycleHook } from "./lifecycle";
import { genConditionsSignal, InitialConditionalRenderKit } from "./mxIf";
import { appendItems, isEqual } from "@rue/utils";
import { diff } from "./diff";
import { insertAndMoveListItemNodes, removeListItemNodes } from "./dom";
import { isReactive } from "../muonic/useReactivize";
import { DynamicNodePod, NodePod } from "./NodePod";



// type DynamicNodePod = NodePod[]


export type NodeEntity = DOMNode | InternalComponent | ListRenderKit | InitialConditionalRenderKit | string | ReactiveSignal<string> // TODO: Attach context to DOMNode, InternalComponent, ListRenderKit, and InitialConditionalRenderKit




type DOMNodeConfig<T extends keyof HTMLElementTagNameMap> = {
    attrs?: AnyObject;
    on?: { [key: string]: () => void } //TODO: how to distinguish handler from reactive getter??
    class?: string | { [key: string]: () => boolean };
    style?: any;
    text?: string | ReactiveSignal<string>;
    nodes?: NodeEntity[];
    key?: string | number
    ref?: Signal
}








export function mx<T extends keyof HTMLElementTagNameMap>(tagName: T, config: DOMNodeConfig<T> = {}): DOMNode {
    const { nodes, text, attrs, class: _class, style, on, ref, key } = config;
    const domNode = document.createElement(tagName);
    const component = getCurrentComponent();
    if (!component || component === "root") throw new Error("No component :(")
    if (text != null && nodes) throw new Error(`Element ${tagName} cannot contain both text and nodes`)
    if (text) setUpTextNode(domNode, text)
    else if (nodes) {
        const nodePod = new NodePod();
        for (const nodeEntity of nodes) {
            setUpNodeEntity(component, domNode, nodeEntity, nodePod)
        }
    }

    if (on) {
        for (const event in on) {

        }
    }


    if (ref) {
        //@ts-expect-error
        ref[SetKey](() => domNode) //NOTE: DomNode will never change for static entities
    }

    return domNode;
}

function setUpTextNode(parent: HTMLElement, text: ReactiveSignal | string, nodePod?: NodePod, fragment?: DocumentFragment) {
    const textNode = createTextNode(text); //QUESTION: In cases of empty string, should textNode be created? What is more important... clean HTML or less DOM manipulations?
    if (nodePod) {
        nodePod.appendStaticNode(textNode)
    }

    const root = fragment ? fragment : parent;
    root.appendChild(textNode)

    if (hasSignal(text)) {
        keepTextNodeUpdated(text, textNode)
    }
}

// function mountDOMNode(parent: HTMLElement, node: DOMNode, prevSibling?: DOMNode | null) {
//     if (prevSibling) {
//         prevSibling.after(node) //TODO: instead, collect consecutive nodes and mount them together?
//     }
//     else if (prevSibling === null) {
//         parent.prepend(node)
//     }
//     else {
//         parent.appendChild(node);
//     }
// }

function keepTextNodeUpdated($text: ReactiveSignal<string>, textNode: CharacterData) {
    watchForUpdate($text, (newValue) => {
        textNode.data = newValue;
    });
}

function createTextNode(value: ReactiveSignal | string) {
    const text = typeof value === "string" ? value : getWithoutTracking(value);
    const textNode = document.createTextNode(text);
    return textNode;
}

// function mountNode(parent: DOMNode, node: DOMNode) {
//     parent.appendChild(node);
// }

// function mountNodes(parent: DOMNode, nodes: (DOMNode | DOMNode[])[]) {
//     for (const nodeOrGroup of nodes) {
//         if (nodeOrGroup instanceof Array) {
//             mountNodes(parent, nodeOrGroup);
//         }
//         else {
//             parent.appendChild(nodeOrGroup);
//         }
//     }
// }


export function setUpNodeEntity(
    component: InternalComponent,
    parent: HTMLElement,
    nodeEntity: NodeEntity,
    nodePod: NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[],
) {
    if (typeof nodeEntity === "string" || hasSignal(nodeEntity)) {
        setUpTextNode(parent, nodeEntity, nodePod, fragment)
    }
    else if (nodeEntity instanceof Node) { // from Web API
        setUpNode(parent, nodeEntity, nodePod, fragment)
    }
    else if (nodeEntity instanceof InternalComponent) {
        setUpComponent(component, parent, nodeEntity, nodePod, fragment)
        if (componentsToUnmount) componentsToUnmount.push(nodeEntity);
    }
    else if (nodeEntity instanceof ListRenderKit) { // this may or may not be dynamic, depending on data
        setUpNodeList(component, parent, nodeEntity, nodePod, fragment, componentsToUnmount);
    }
    else if (nodeEntity instanceof InitialConditionalRenderKit) {
        setUpConditionalEntity(component, parent, nodeEntity, nodePod, fragment, componentsToUnmount)
    }
    else {
        throw new Error("Invalid input")
    }
}



function setUpNode(parent: HTMLElement, node: DOMNode, nodePod: NodePod, fragment?: DocumentFragment) {
    nodePod.appendStaticNode(node)
    const root = fragment ? fragment : parent;
    root.appendChild(node)
}



function setUpComponent(parentComponent: InternalComponent, parent: HTMLElement, component: InternalComponent, nodePod: NodePod, fragment?: DocumentFragment) { //TODO: what if a component's root elements is conditional or a dynamic list??
    const nodeEntities = component.initialNodeEntities;
    if (!(parent instanceof HTMLElement)) throw new Error("Parent cannot be a text node")
    component.emit(LifecycleHook.BEFORE_MOUNT);
    for (const nodeEntity of nodeEntities) {
        setUpNodeEntity(parentComponent, parent, nodeEntity, nodePod, fragment)
    }
    component.emit(LifecycleHook.MOUNTED);
}

function setUpNodeList(
    component: InternalComponent,
    parent: HTMLElement,
    renderKit: ListRenderKit,
    nodePod: NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[]
) {
    const { data, initialNodeEntities, renderItem, idKey } = renderKit;
    const isDynamic = isReactive(data) || hasSignal(data);
    const dynamicPod = isDynamic ? nodePod.appendDynamicPod() : undefined;

    for (const nodeEntities of initialNodeEntities) {
        nodePod = isDynamic ? dynamicPod!.appendNodePod() : nodePod;
        for (const nodeEntity of nodeEntities) {
            setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, componentsToUnmount);
        }
    }

    // [node, node, [[node, [node, node]], [node, [node]], [node, [node]]], ]

    if (isDynamic) {
        // set up watcher for updates
        watchForUpdate(data, (newValue: AnyObject[], oldValue: AnyObject[]) => {
            const { removeKit, insertAndMoveKit, noChange } = diff(newValue, oldValue, idKey)
            if (noChange) return;
            if (dynamicPod!.length !== newValue.length) throw new Error("dynamicPod and data length are mismatched. This should never happen.")
            removeListItemNodes(component, dynamicPod!, removeKit!)
            insertAndMoveListItemNodes(component, insertAndMoveKit!, dynamicPod!, parent, renderItem)

        })
    }
}


function setUpConditionalEntity(
    component: InternalComponent,
    parent: HTMLElement,
    renderKit: InitialConditionalRenderKit,
    nodePod: NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[],
) {
    const { conditionalKits, initialNodeEntities, $initialConditions, initialIndex } = renderKit;

    let activeIndex = initialIndex;

    const dynamicPod = nodePod.appendDynamicPod();

    const _conditionalKits: {
        $condition?: ReactiveSignal<boolean>;
        nodePod: NodePod;
        renderConditional: () => NodeEntity[];
    }[] = []

    for (let i = 0; i < conditionalKits.length; i++) {
        const { renderConditional, $condition } = conditionalKits[i];
        const nodePod = dynamicPod.appendNodePod();
        _conditionalKits.push({ $condition, nodePod, renderConditional });
    }

    for (const nodeEntity of initialNodeEntities) {
        // append to dom and node pod
        setUpNodeEntity(component, parent, nodeEntity, _conditionalKits[initialIndex].nodePod, fragment, componentsToUnmount)
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
    watchForUpdate($initialConditions, updateConditional, { once: true })

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        if (isEqual(newValue, oldValue)) return;
        const conditions: ReactiveSignal<boolean>[] = [];
        for (let i = 0; i < conditionalKits.length; i++) {
            const kit = conditionalKits[i]
            const { renderConditional, $condition } = kit;
            if ($condition) conditions.push($condition);
            if ($condition && getWithoutTracking($condition) || !$condition) {
                removePrevConditionalNodes(component, dynamicPod, activeIndex);
                activeIndex = i;
                insertNewConditionalNodes(component, parent, dynamicPod, renderConditional, activeIndex)
                break;
            }
        }
        watchForUpdate(genConditionsSignal(conditions), updateConditional, { once: true })
    }
}

export function emitHookBatch(hookName: LifecycleHook, components: InternalComponent[]) {
    for (const compo of components) {
        compo.emit(hookName);
    }
}

function removePrevConditionalNodes(component: InternalComponent, dynamicPod: DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    const components = nodePod.componentsToUnmount;
    emitHookBatch(LifecycleHook.BEFORE_UNMOUNT, components!)
    component.emit(LifecycleHook.BEFORE_UPDATE)
    removeDOMNodes(nodePod)
    emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    component.emit(LifecycleHook.UPDATED)
    dynamicPod.replaceNodePod(activeIndex, new NodePod()); // clears previous
}

export function removeDOMNodes(nodePod: NodePod) {
    for (const nodeEntity of nodePod) {
        if (nodeEntity instanceof DynamicNodePod) {
            for (const nodePod of nodeEntity) {
                removeDOMNodes(nodePod) // What if there were components nested here? how do you unmount them?
            }
        }
        else {
            nodeEntity.remove()
        }
    }
}

function insertNewConditionalNodes(component: InternalComponent, parent: HTMLElement, dynamicPod: DynamicNodePod, renderConditional: () => NodeEntity[], activeIndex: number) {
    const nodePod = new NodePod();
    dynamicPod.replaceNodePod(activeIndex, nodePod);

    const nodeEntities = renderConditional();
    const fragment = new DocumentFragment()
    for (const nodeEntity of nodeEntities) {
        setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount)
    }
    component.emit(LifecycleHook.BEFORE_UPDATE);
    let prevSibling = dynamicPod.prevNode;
    if (prevSibling) prevSibling.after(fragment)
    else parent.prepend(fragment)
    component.emit(LifecycleHook.UPDATED);
}


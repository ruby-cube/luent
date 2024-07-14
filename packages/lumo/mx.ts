import { AnyObject, OptionalKeys } from "@rue/types";
import { DOMNode, getCurrentComponent, InternalComponent, setCurrentComponent } from "./component";
import { watchForUpdate } from "./watchForUpdate";
import { hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal";
import { getWithoutTracking } from "../muonic/DependencyTracker";
import { DynamicIndices, insertAndMoveListItemNodes, ListRenderKit, removeListItemNodes } from "./mXsFor";
import { LifecycleHook, onUnmounted } from "./lifecycle";
import { genConditionsSignal, InitialConditionalRenderKit } from "./mXIf";
import { appendItems, isEqual } from "@rue/utils";
import { diff } from "./diff";
import { isReactive } from "../muonic/useReactivize";
import { _DynamicNodePod, _NodePod } from "./NodePod";
import { _NodeRef, castOnCreatedHook, NodeRef } from "./NodeRef";
import { useReactivity } from "../muonic/useReactivity";
import { Signal } from "../muonic/useSignalize";
import { initializeEffect, watch } from "../muonic/watch";
import { symlink } from "fs";


export type NodeEntity = DOMNode | InternalComponent | ListRenderKit | InitialConditionalRenderKit | string | ReactiveSignal<string> // TODO: Attach context (needs) to DOMNode, InternalComponent, ListRenderKit, and InitialConditionalRenderKit

export const m = _mX;


// type EventHandler = T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;

type DOMNodeConfig<T extends keyof HTMLElementTagNameMap> = {
    attributes?: AnyObject;
    on?: { [key: string]: (e: Event, index?: number) => void }
    class?: string;
    style?: { [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] };
    text?: any | ReactiveSignal<any>;
    children?: NodeEntity[];
    ref?: NodeRef,
    $index?: Signal<number>
}

export const _internalReactivity = useReactivity()

export function _mX<T extends keyof HTMLElementTagNameMap>(tagName: T, config: DOMNodeConfig<T> = {}): DOMNode {
    const { children, text, attributes, class: _class, style, on, ref, $index } = config;
    const domNode = document.createElement(tagName);
    const component = getCurrentComponent();
    if (!component || component === "root") throw new Error("No component :(")
    if (text != null && children) throw new Error(`Element ${tagName} cannot contain both text and childNodes`)

    if (text !== undefined) setUpTextNode(domNode, text)
    else if (children) {
        const nodePod = new _NodePod();
        for (const childNodeEntity of children) {
            setUpNodeEntity(component, domNode, childNodeEntity, nodePod)
        }
    }

    if (_class) domNode.classList.value = _class

    if (on) {
        for (const event in on) {
            const handler = on[event]
            const _handler = $index ? (e: Event) => handler(e, $index()) : handler
            domNode.addEventListener(event, _handler)
            onUnmounted(() => domNode.removeEventListener(event, _handler))
        }
    }

    if (style) {
        for (const property in style) {
            domNode.style[property] = style[property]!
        }
    }

    if (attributes) {
        for (const property in attributes) {
            domNode.setAttribute(property, attributes[property])
        }
    }

    if (ref) {
        assignNodeRef(ref, domNode, $index)
        castOnCreatedHook(ref, domNode, $index)
    }


    return domNode;
}

function assignNodeRef(ref: _NodeRef, domNode: HTMLElement, $index: Signal<number> | undefined) {
    if ($index != null) {
        let nodes = ref.nodes ? ref.nodes! : []
        nodes[$index()] = domNode;
    }
    else {
        ref.node = domNode // domNode will never change for static entities
    }
}

function setUpTextNode(parent: HTMLElement, text: ReactiveSignal | any, nodePod?: _NodePod, fragment?: DocumentFragment) {
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

function createTextNode(value: ReactiveSignal | any) {
    const _value = hasSignal(value) ? getWithoutTracking(value) : value;
    const text = _value.toString() //TODO: make sure it works with any value
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
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[],
    $index?: Signal<number>
) {
    if (typeof nodeEntity === "string" || hasSignal(nodeEntity)) {
        setUpTextNode(parent, nodeEntity, nodePod, fragment)
    }
    else if (nodeEntity instanceof HTMLElement) { // from Web API
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



function setUpNode(parent: HTMLElement, node: DOMNode, nodePod: _NodePod, fragment?: DocumentFragment) {
    nodePod.appendStaticNode(node)
    const root = fragment ? fragment : parent;
    root.appendChild(node)
}



export function setUpComponent(
    parentComponent: InternalComponent,
    parent: HTMLElement,
    component: InternalComponent,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
) { //TODO: what if a component's root elements is conditional or a dynamic list??
    const nodeEntities = component.initialNodeEntities;
    if (!(parent instanceof HTMLElement)) throw new Error("Parent cannot be a text node")
    component.emit(LifecycleHook.PREMOUNT);
    for (const nodeEntity of nodeEntities) {
        setUpNodeEntity(parentComponent, parent, nodeEntity, nodePod, fragment)
    }
    component.emit(LifecycleHook.MOUNTED);
}

function setUpNodeList(
    component: InternalComponent,
    parent: HTMLElement,
    renderKit: ListRenderKit,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[],
) {
    const { data, initialNodeEntities, renderItem, indices } = renderKit;
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
        const dynamicIndices = new DynamicIndices(indices)

        // set up watcher for updates
        watchForUpdate(data, (newValue: AnyObject[], oldValue: AnyObject[]) => {
            const { indicesToRemove, insertAndMoveKit, noChange } = diff(newValue, oldValue)
            if (noChange) return;
            if (dynamicPod!.length !== oldValue.length) throw new Error("dynamicPod and data length are mismatched. This should never happen.")
            component.emit(LifecycleHook.PREUPDATE)
            removeListItemNodes(dynamicPod!, indicesToRemove!);
            insertAndMoveListItemNodes(component, insertAndMoveKit!, dynamicPod!, parent, renderItem, dynamicIndices)
            component.emit(LifecycleHook.UPDATED)
        })
    }
}



function setUpConditionalEntity(
    component: InternalComponent,
    parent: HTMLElement,
    renderKit: InitialConditionalRenderKit,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[],
) {
    const { conditionalKits, initialNodeEntities, $initialConditions, initialIndex } = renderKit;

    let activeIndex = initialIndex;

    const dynamicPod = nodePod.appendDynamicPod();

    const _conditionalKits: {
        $condition?: ReactiveSignal<boolean>;
        nodePod: _NodePod;
        renderConditional: () => NodeEntity[] | NodeEntity;
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
        setCurrentComponent(component)
        watchForUpdate(genConditionsSignal(conditions), updateConditional, { once: true })
        setCurrentComponent(null)
    }
}

export function emitHookBatch(hookName: LifecycleHook, components: InternalComponent[]) {
    for (const compo of components) {
        compo.emit(hookName);
    }
}



export function removeDOMNodes(nodePod: _NodePod) {
    for (const nodeEntity of nodePod) {
        if (nodeEntity instanceof _DynamicNodePod) {
            for (const nodePod of nodeEntity) {
                removeDOMNodes(nodePod) // What if there were components nested here? how do you unmount them?
            }
        }
        else {
            nodeEntity.remove()
        }
    }
}

function removePrevConditionalNodes(component: InternalComponent, dynamicPod: _DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    const components = nodePod.componentsToUnmount;
    emitHookBatch(LifecycleHook.PREUNMOUNT, components!)
    component.emit(LifecycleHook.PREUPDATE)
    removeDOMNodes(nodePod)
    emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    component.emit(LifecycleHook.UPDATED)
    dynamicPod.replaceNodePod(activeIndex, new _NodePod()); // clears previous
}

function insertNewConditionalNodes(component: InternalComponent, parent: HTMLElement, dynamicPod: _DynamicNodePod, renderConditional: () => NodeEntity[] | NodeEntity, activeIndex: number) {
    const nodePod = new _NodePod();
    dynamicPod.replaceNodePod(activeIndex, nodePod);
    setCurrentComponent(component);
    const nodeEntities = normalizeRenderOutput(renderConditional());
    setCurrentComponent(null)

    const fragment = new DocumentFragment()
    for (const nodeEntity of nodeEntities) {
        setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount) //TODO: pass in index in case it's in a list?
    }
    component.emit(LifecycleHook.PREUPDATE);
    let prevSibling = dynamicPod.prevNode;
    if (prevSibling) prevSibling.after(fragment)
    else parent.prepend(fragment)
    component.emit(LifecycleHook.UPDATED);
}

export function normalizeRenderOutput(output: NodeEntity[] | NodeEntity) {
    return output instanceof Array ? output : [output]
}


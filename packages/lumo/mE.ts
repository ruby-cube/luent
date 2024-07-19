import { AnyObject, OptionalKeys } from "@rue/types";
import { ComponentSetup, DOMNode, getCurrentComponent, InternalComponent, setCurrentComponent } from "./component";
import { hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal";
import { getWithoutTracking } from "../muonic/DependencyTracker";
import { DynamicIndices, getCurrentItemAndIndex, insertAndMoveListItemNodes, ListRenderKit, removeListItemNodes } from "./forEachIn";
import { LifecycleHook, onBeforeUnmount, onUnmounted } from "./lifecycle";
import { _mountIf, genConditionsSignal, ConditionalKit, watchForRenderAndPreserve, initializeRenderEffectAndPreserve } from "./ifCase";
import { appendItems, copyAllBut, isEqual } from "@rue/utils";
import { diff } from "./diff";
import { isReactive } from "../muonic/useReactivize";
import { _DynamicNodePod, _NodePod, NodePod } from "./NodePod";
import { _NodeRef, assignNodeRef, castOnCreatedHook, getNodRef, NodeRef, nullNodeRef } from "./NodeRef";
import { useReactivity } from "../muonic/useReactivity";
import { Signal } from "../muonic/useSignalize";
import { getNodeConfig } from "./setUpNode";
import { ComponentConfig, ComponentOptions, makeComponent, RenderSlot, SlotRenderer } from "./makeComponent";
import { initializeRenderEffect, watchForRender } from "./watchForRender";
import { hideDOMNodes } from "./showIf";

export type NodeEntity = DOMNode | InternalComponent | ListRenderKit | ConditionalKit | any | ReactiveSignal<any> // TODO: Attach context (needs) to DOMNode, InternalComponent, ListRenderKit, and ConditionalKit

// type ElementOptions = { main?: true }


function setUpDynamicClasses(component: InternalComponent, nodeRef: _NodeRef<HTMLElement>, reactiveEffects: ((o: DOMTokenList) => void)[]) {
    const _initializeRenderEffect = component.preserve ? initializeRenderEffectAndPreserve : initializeRenderEffect
    nodeRef.onCreated((node) => {
        for (const effect of reactiveEffects) {
            _initializeRenderEffect(() => effect(node.classList))
        }
    })

}

function setUpDynamicStyles(component: InternalComponent, nodeRef: _NodeRef<HTMLElement>, reactiveEffects: ((o: CSSStyleDeclaration) => void)[]) {
    const _initializeRenderEffect = component.preserve ? initializeRenderEffectAndPreserve : initializeRenderEffect
    nodeRef.onCreated((node) => {
        for (const effect of reactiveEffects) {
            _initializeRenderEffect(() => effect(node.style))
        }
    })
}
// type EventHandler = T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;


export type DOMNodeConfig = {
    attributes?: AnyObject;
    on?: { [key: string]: ((e: Event, index: number) => void) | ((e: Event) => void) }
    class?: string;
    style?: { [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] };
    dynamicClasses?: ((o: DOMTokenList) => void)[],
    dynamicStyles?: ((o: CSSStyleDeclaration) => void)[],
    // text?: any | ReactiveSignal<any>;
    // children?: NodeEntity[];
    // ref?: NodeRef,
    $index?: Signal<number>
}

export type HTMLTag = keyof HTMLElementTagNameMap



export const _internalReactivity = useReactivity()


export function mE(
    nodeType: HTMLTag,
    childNodes?: NodeEntity[],
    closingTag?: HTMLTag | NodeRef | DOMNodeConfig,
    // options?: ElementOptions
): DOMNode
export function mE(
    nodeType: HTMLTag,
    childNodes?: NodeEntity[],
    closingTag?: HTMLTag | NodeRef | DOMNodeConfig,
    // closingTag?: HTMLTag | NodeRef | DOMNodeConfig | ElementOptions,
): DOMNode
export function mE<T extends ComponentSetup>(
    nodeType: T,
    childNodes?: NodeEntity[] | RenderSlot[] | SlotRenderer<T>,
    closingTag?: T | NodeRef | ComponentConfig,
    options?: ComponentOptions
): InternalComponent
export function mE<T extends ComponentSetup>(
    nodeType: T,
    childNodes?: NodeEntity[] | RenderSlot[] | SlotRenderer<T>,
    closingTag?: T | NodeRef | ComponentConfig | ComponentOptions
): InternalComponent
export function mE(
    nodeType: HTMLTag | ComponentSetup,
    childNodes?: NodeEntity[] | RenderSlot[] | SlotRenderer,
    // closingTag?: HTMLTag | ComponentSetup | NodeRef | DOMNodeConfig | ComponentConfig | ElementOptions,
    closingTag?: HTMLTag | ComponentSetup | NodeRef | DOMNodeConfig | ComponentConfig,
    // options?: ElementOptions | ComponentOptions
    options?: ComponentOptions
): DOMNode | InternalComponent {
    validateClosingTag(nodeType, closingTag);
    const ref: _NodeRef | undefined = closingTag instanceof NodeRef ? <_NodeRef><unknown>closingTag : undefined;
    const config = _getNodeConfig(closingTag);
    const _options = options ? options : isOptions(closingTag) ? closingTag : undefined
    if (typeof nodeType === 'string') {

        return makeElement(nodeType, <DOMNodeConfig>config, <NodeEntity[]>childNodes, <_NodeRef<HTMLElement>>ref)
    }
    return makeComponent(nodeType, <ComponentConfig>config, childNodes, <_NodeRef<InternalComponent>>ref, <ComponentOptions>_options)
}

function isOptions(maybeOptions: any): maybeOptions is ComponentOptions {
    return maybeOptions instanceof Object && ('preserve' in maybeOptions)
}


function validateClosingTag(nodeType: HTMLTag | ComponentSetup, closingTag: HTMLTag | ComponentSetup | NodeRef | DOMNodeConfig | ComponentConfig | ComponentOptions | undefined) {
    if (closingTag === undefined || isOptions(closingTag)) return;
    if (nodeType === closingTag) return;
    if (typeof closingTag === 'string') throw new Error(`closing tag, ${closingTag}, does not match opening tag ${nodeType}`);
    if (closingTag instanceof Function) throw new Error(`Component, ${closingTag.name}, does not match node type, ${nodeType}`)
    if (closingTag instanceof NodeRef && closingTag.nodeType !== nodeType) throw new Error(`Node ref's node type, ${closingTag.nodeType}, does not match node type, ${nodeType}`);
}


function _getNodeConfig(closingTag: HTMLTag | ComponentSetup | NodeRef | DOMNodeConfig | ComponentConfig | ComponentOptions | undefined) {
    if (typeof closingTag === 'string' || closingTag instanceof Function || closingTag === undefined) return {};
    if (closingTag instanceof NodeRef) {
        const config = getNodeConfig(closingTag);
        if (config instanceof Function) {
            const [item, $index] = getCurrentItemAndIndex();
            const _config = config(item, $index)
            return _config
        }
        return config;
    }
    return closingTag;
}

function initializeRef( // should this be initialize ref?
    component: InternalComponent,
    dynamicClasses: ((o: DOMTokenList) => void)[] | undefined,
    dynamicStyles: ((o: CSSStyleDeclaration) => void)[] | undefined,
    ref: _NodeRef<HTMLElement>,
    // options?: ElementOptions
) {
    if (ref.initialized === true) return;

    if (dynamicClasses) {
        if (!ref) throw new Error(`nodeRef must be passed into mE to register dynamic classes`)
        setUpDynamicClasses(component, ref, dynamicClasses)
    }

    if (dynamicStyles) {
        if (!ref) throw new Error(`nodeRef must be passed into mE to register dynamic styles`)
        setUpDynamicStyles(component, ref, dynamicStyles)
    }

    onBeforeUnmount(() => {
        ref.node = null;
        ref.nodes = null;
    })

    ref.initialized = true
}

export function makeElement<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    config: DOMNodeConfig = {},
    childNodes: NodeEntity[] | undefined,
    ref: _NodeRef<HTMLElement> | undefined,
    // options?: ElementOptions
): DOMNode {

    const { attributes, class: _class, style, on, $index, dynamicClasses, dynamicStyles } = config;
    const domNode = document.createElement(tagName);
    const component = getCurrentComponent();
    if (!component || component === "root") throw new Error("No component :(")
    // if (text != null && childNodes) throw new Error(`Element ${tagName} cannot contain both text and childNodes`)

    // if (text !== undefined) setUpTextNode(domNode, text)
    // else 


    if (childNodes) {
        const nodePod = new _NodePod();
        for (const childNodeEntity of childNodes) {
            setUpNodeEntity(component, domNode, childNodeEntity, nodePod)
        }
    }

    if (_class) domNode.classList.value = _class


    if (on) {
        for (const event in on) {
            const handler = on[event]
            const _handler = $index ? (e: Event) => handler(e, $index()) : handler as EventListenerOrEventListenerObject
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
        assignNodeRef(ref, domNode, $index) //TODO: need a better strategy for updating ref nodes
        initializeRef(component, dynamicClasses, dynamicStyles, ref)
        castOnCreatedHook(ref, domNode, $index)
    }

    // if (options) {
    //     const { main } = options
    //     if ('mountIf' in options) _mountIf(options.mountIf, { mount: () => makeElement(tagName, config, childNodes, ref, { main }) }) //TODO: not sure about main yet, do I store it on initialization or reset it on each new render?
    //     if ('showIf' in options);// TODO: showIf
    // }


    return domNode;
}

function setUpRefNulling(ref: _NodePod, $index: Signal<number>) {
    if ($index && $index() === 0) {

    }
    else {
        onBeforeUnmount(() => {

        })
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

function keepTextNodeUpdated($text: ReactiveSignal<any>, textNode: CharacterData) {
    const component = getCurrentComponent();
    if (!component || component === "root") throw new Error("No component found")
    const _watchForRender = component.preserve ? watchForRenderAndPreserve : watchForRender
    _watchForRender($text, (newValue: any) => {
        textNode.data = toString(newValue);
    });
}



function createTextNode(value: ReactiveSignal | any) {
    const _value = hasSignal(value) ? getWithoutTracking(value) : value;
    const text = toString(_value)
    const textNode = document.createTextNode(text);
    return textNode;
}

function toString(value: any) {
    return value.toString(); //TODO: make sure it works with any value
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
) {
    if (nodeEntity instanceof HTMLElement) { // from Web API
        mountNode(parent, nodeEntity, nodePod, fragment)
    }
    else if (nodeEntity instanceof InternalComponent) {
        setUpComponent(component, parent, nodeEntity, nodePod, fragment)
        if (componentsToUnmount) componentsToUnmount.push(nodeEntity);
    }
    else if (nodeEntity instanceof ListRenderKit) { // this may or may not be dynamic, depending on data
        setUpNodeList(component, parent, nodeEntity, nodePod, fragment, componentsToUnmount);
    }
    else if (nodeEntity instanceof ConditionalKit) {
        setUpConditionalEntity(component, parent, nodeEntity, nodePod, fragment, componentsToUnmount)
    }
    else {
        setUpTextNode(parent, nodeEntity, nodePod, fragment)
    }
}



function mountNode(parent: HTMLElement, node: DOMNode, nodePod: _NodePod, fragment?: DocumentFragment) {
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
        const _watchForRender = component.preserve ? watchForRenderAndPreserve : watchForRender

        // set up watcher for updates
        _watchForRender(data, (newValue: AnyObject[], oldValue: AnyObject[]) => {
            const { indicesToRemove, insertAndMoveKit, noChange } = diff(newValue, oldValue)
            if (noChange) return;
            if (dynamicPod!.length !== oldValue.length) throw new Error("dynamicPod and data length are mismatched. This should never happen.")
            component.emit(LifecycleHook.BEFORE_UPDATE)
            removeListItemNodes(dynamicPod!, indicesToRemove!);
            insertAndMoveListItemNodes(component, insertAndMoveKit!, dynamicPod!, parent, renderItem, dynamicIndices)
            component.emit(LifecycleHook.UPDATED)
        })
    }
}



function setUpConditionalEntity(
    component: InternalComponent,
    parent: HTMLElement,
    renderKit: ConditionalKit,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[],
) {
    const { conditionalKits, initialNodeEntities, $initialConditions, initialIndex, type } = renderKit;

    let activeIndex = initialIndex;

    const dynamicPod = nodePod.appendDynamicPod();

    const _conditionalKits: {
        $condition?: ReactiveSignal<boolean>;
        nodePod: _NodePod;
        renderConditional: (() => NodeEntity[] | NodeEntity) | (() => void);
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
    const _watchForRender = component.preserve ? watchForRenderAndPreserve : watchForRender

    _watchForRender($initialConditions, updateConditional, { once: true })

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        if (isEqual(newValue, oldValue)) return;
        const conditions: ReactiveSignal<boolean>[] = [];
        for (let i = 0; i < conditionalKits.length; i++) {
            const kit = conditionalKits[i]
            const { renderConditional, $condition } = kit;
            if ($condition) conditions.push($condition);
            if ($condition && getWithoutTracking($condition) || !$condition) {
                // if (type === 'show') hidePrevConditionalNodes(component, dynamicPod, activeIndex) //FIX:
                // else 
                removePrevConditionalNodes(component, dynamicPod, activeIndex, renderConditional);
                activeIndex = i;
                insertNewConditionalNodes(component, parent, dynamicPod, renderConditional, activeIndex)
                break;
            }
        }
        setCurrentComponent(component)
        watchForRender(genConditionsSignal(conditions), updateConditional, { once: true })
        setCurrentComponent(null)
    }

}

export function emitHookBatch(hookName: LifecycleHook, components: InternalComponent[] | undefined) {
    if (!components) return;
    for (const compo of components) {
        compo.emit(hookName);
    }
}

// function forEachInNodePod(nodePod: _NodePod, doTask: (node: DOMNode) => void) {

// }

export function removeDOMNodes(nodePod: _NodePod, type: 'destroy' | 'preserve') {
    nodePod.forEachNode((node) => {
        node.remove();
        nullNodeRef(node, type);
    })
}


export function populateFragment(fragment: DocumentFragment, nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        fragment.appendChild(node)
    })
}

const preservedNodePods: WeakMap<() => NodeEntity[] | NodeEntity, _NodePod> = new WeakMap();

function getPreservedNodePod(renderConditional: () => NodeEntity[] | NodeEntity) {
    const nodePod = preservedNodePods.get(renderConditional)
    if (!nodePod) throw new Error("nodePod missing")
    return nodePod;
}

function removePrevConditionalNodes(component: InternalComponent, dynamicPod: _DynamicNodePod, activeIndex: number, renderConditional: () => NodeEntity[] | NodeEntity) {
    const preserve = component.preserve;
    const nodePod = dynamicPod[activeIndex];
    const components = nodePod.componentsToUnmount;

    if (preserve) {
        preservedNodePods.set(renderConditional, nodePod)
    }
    else {
        emitHookBatch(LifecycleHook.BEFORE_UNMOUNT, components)
    }

    component.emit(LifecycleHook.BEFORE_UPDATE)
    removeDOMNodes(nodePod, preserve ? 'preserve' : 'destroy')
    emitHookBatch(preserve ? LifecycleHook.DEACTIVATED : LifecycleHook.UNMOUNTED, components)
    component.emit(LifecycleHook.UPDATED)
    dynamicPod.replaceNodePod(activeIndex, new _NodePod()); // clears previous
}

function hidePrevConditionalNodes(component: InternalComponent, dynamicPod: _DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    const components = nodePod.componentsToUnmount;
    emitHookBatch(LifecycleHook.BEFORE_UNMOUNT, components!)
    component.emit(LifecycleHook.BEFORE_UPDATE)
    hideDOMNodes(nodePod)
    emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    component.emit(LifecycleHook.UPDATED)
}

function insertNewConditionalNodes(component: InternalComponent, parent: HTMLElement, dynamicPod: _DynamicNodePod, renderConditional: () => NodeEntity[] | NodeEntity, activeIndex: number) {
    const preserve = component.preserve;
    const nodePod = preserve ? getPreservedNodePod(renderConditional) : new _NodePod();
    dynamicPod.replaceNodePod(activeIndex, nodePod);

    const fragment = new DocumentFragment();

    if (!preserve) {
        setCurrentComponent(component);
        const nodeEntities = normalizeRenderOutput(renderConditional());
        setCurrentComponent(null)

        for (const nodeEntity of nodeEntities) {
            setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount) //TODO: pass in index in case it's in a list?
        }
    }
    else {
        populateFragment(fragment, nodePod);
        emitHookBatch(LifecycleHook.ACTIVATED, nodePod.componentsToUnmount)
    }

    component.emit(LifecycleHook.BEFORE_UPDATE);
    let prevSibling = dynamicPod.prevNode;
    if (prevSibling) prevSibling.after(fragment)
    else parent.prepend(fragment)
    component.emit(LifecycleHook.UPDATED);
}

export function normalizeRenderOutput(output: NodeEntity[] | NodeEntity) {
    return output instanceof Array ? output : [output]
}


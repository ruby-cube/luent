import { AnyObject, OptionalKeys } from "@rue/types";
import { ComponentSetup, DOMNode, getCurrentComponent, InternalComponent, setCurrentComponent } from "./component";
import { hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal";
import { getWithoutTracking } from "../muonic/DependencyTracker";
import { DynamicIndices, insertAndMoveListItemNodes, ListRenderKit, removeListItemNodes } from "./forEachIn";
import { LifecycleHook, onUnmounted } from "./lifecycle";
import { _mountIf, genConditionsSignal, ConditionalKit } from "./ifCase";
import { appendItems, isEqual } from "@rue/utils";
import { diff } from "./diff";
import { isReactive } from "../muonic/useReactivize";
import { _DynamicNodePod, _NodePod } from "./NodePod";
import { _NodeRef, castOnCreatedHook, NodeRef } from "./NodeRef";
import { useReactivity } from "../muonic/useReactivity";
import { Signal } from "../muonic/useSignalize";
import { getNodeConfig } from "./setUpNode";
import { ComponentConfig, ComponentOptions, makeComponent, RenderSlot, SlotRenderer } from "./makeComponent";
import { initializeRenderEffect, watchForRender } from "./watchForRender";


export type NodeEntity = DOMNode | InternalComponent | ListRenderKit | ConditionalKit | string | ReactiveSignal<string> // TODO: Attach context (needs) to DOMNode, InternalComponent, ListRenderKit, and ConditionalKit

type ElementOptions = { main?: true }


function setUpDynamicClasses(nodeRef: _NodeRef<HTMLElement>, reactiveEffects: ((o: DOMTokenList) => void)[]) {
    nodeRef.onCreated((node) => {
        for (const effect of reactiveEffects) {
            initializeRenderEffect(() => effect(node.classList)) //TODO: schedule for update
        }
    })
}

function setUpDynamicStyles(nodeRef: _NodeRef<HTMLElement>, reactiveEffects: ((o: CSSStyleDeclaration) => void)[]) {
    nodeRef.onCreated((node) => {
        for (const effect of reactiveEffects) {
            initializeRenderEffect(() => effect(node.style))
        }
    })
}
// type EventHandler = T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;


export type DOMNodeConfig = {
    attributes?: AnyObject;
    on?: { [key: string]: (e: Event, index?: number) => void }
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
    childNodes: NodeEntity[],
    closingTag: HTMLTag | NodeRef | DOMNodeConfig,
    options?: ElementOptions
): DOMNode
export function mE(
    nodeType: HTMLTag,
    childNodes: NodeEntity[],
    closingTag?: HTMLTag | NodeRef | DOMNodeConfig | ElementOptions,
): DOMNode
export function mE<T extends ComponentSetup>(
    nodeType: T,
    childNodes: NodeEntity[] | RenderSlot[] | SlotRenderer<T>,
    closingTag: T | NodeRef | ComponentConfig,
    options?: ComponentOptions
): InternalComponent
export function mE<T extends ComponentSetup>(
    nodeType: T,
    childNodes: NodeEntity[] | RenderSlot[] | SlotRenderer<T>,
    closingTag?: T | NodeRef | ComponentConfig | ComponentOptions
): InternalComponent
export function mE(
    nodeType: HTMLTag | ComponentSetup,
    childNodes: NodeEntity[] | RenderSlot[] | SlotRenderer,
    closingTag?: HTMLTag | ComponentSetup | NodeRef | DOMNodeConfig | ComponentConfig | ElementOptions,
    options?: ElementOptions | ComponentOptions
): DOMNode | InternalComponent {
    validateClosingTag(nodeType, closingTag);
    const ref: _NodeRef | undefined = closingTag instanceof NodeRef ? <_NodeRef><unknown>closingTag : undefined;
    const config = _getNodeConfig(closingTag);
    const _options = options ? options : isOptions(closingTag) ? closingTag : undefined
    if (typeof nodeType === 'string') {
        if (ref && ref.initialized === false) initializeElement((<DOMNodeConfig>config).dynamicClasses, (<DOMNodeConfig>config).dynamicStyles, <_NodeRef<HTMLElement>>ref, <ElementOptions>_options) //TODO: how do I know if something is initialized?
        return makeElement(nodeType, <DOMNodeConfig>config, <NodeEntity[]>childNodes, <_NodeRef<HTMLElement>>ref, <ElementOptions>_options)
    }
    return makeComponent(nodeType, <ComponentConfig>config, childNodes, <_NodeRef<InternalComponent>>ref, <ComponentOptions>_options)
}

function isOptions(maybeOptions: any): maybeOptions is ElementOptions | ComponentOptions {
    return maybeOptions instanceof Object && ('preserve' in maybeOptions || 'main' in maybeOptions)
}


function validateClosingTag(nodeType: HTMLTag | ComponentSetup, closingTag: HTMLTag | ComponentSetup | NodeRef | DOMNodeConfig | ComponentConfig | ComponentOptions | ElementOptions | undefined) {
    if (closingTag === undefined || isOptions(closingTag)) return;
    if (nodeType === closingTag) return;
    if (typeof closingTag === 'string') throw new Error(`closing tag, ${closingTag}, does not match opening tag ${nodeType}`);
    if (closingTag instanceof Function) throw new Error(`Component, ${closingTag.name}, does not match node type, ${nodeType}`)
    if (closingTag instanceof NodeRef && closingTag.nodeType !== nodeType) throw new Error(`Node ref's node type, ${closingTag.nodeType}, does not match node type, ${nodeType}`);
}


function _getNodeConfig(closingTag: HTMLTag | ComponentSetup | NodeRef | DOMNodeConfig | ComponentConfig | ComponentOptions | ElementOptions | undefined) {
    if (typeof closingTag === 'string' || closingTag instanceof Function || closingTag === undefined) return {};
    if (closingTag instanceof NodeRef) return getNodeConfig(closingTag);
    return closingTag;
}

function initializeElement( // should this be initialize ref?
    dynamicClasses: ((o: DOMTokenList) => void)[] | undefined,
    dynamicStyles: ((o: CSSStyleDeclaration) => void)[] | undefined,
    ref: _NodeRef<HTMLElement>,
    options?: ElementOptions
) {
    if (dynamicClasses) {
        if (!ref) throw new Error(`nodeRef must be passed into mE to register dynamic classes`)
        setUpDynamicClasses(ref, dynamicClasses)
    }

    if (dynamicStyles) {
        if (!ref) throw new Error(`nodeRef must be passed into mE to register dynamic styles`)
        setUpDynamicStyles(ref, dynamicStyles)
    }

    ref.initialized = true
}

export function makeElement<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    config: DOMNodeConfig = {},
    childNodes: NodeEntity[],
    ref: _NodeRef<HTMLElement> | undefined,
    options?: ElementOptions
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

    if (options) {
        const { main } = options
        if ('mountIf' in options) _mountIf(options.mountIf, { mount: () => makeElement(tagName, config, childNodes, ref, { main }) }) //TODO: not sure about main yet, do I store it on initialization or reset it on each new render?
        if ('showIf' in options);// TODO: showIf
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
    watchForRender($text, (newValue) => {
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
) {
    if (typeof nodeEntity === "string" || hasSignal(nodeEntity)) {
        setUpTextNode(parent, nodeEntity, nodePod, fragment)
    }
    else if (nodeEntity instanceof HTMLElement) { // from Web API
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
        throw new Error("Invalid input")
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
        watchForRender(data, (newValue: AnyObject[], oldValue: AnyObject[]) => {
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
    watchForRender($initialConditions, updateConditional, { once: true })

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        if (isEqual(newValue, oldValue)) return;
        const conditions: ReactiveSignal<boolean>[] = [];
        for (let i = 0; i < conditionalKits.length; i++) {
            const kit = conditionalKits[i]
            const { renderConditional, $condition } = kit;
            if ($condition) conditions.push($condition);
            if ($condition && getWithoutTracking($condition) || !$condition) {
                if (type === 'show') hidePrevConditionalNodes(component, dynamicPod, activeIndex) //FIX:
                else removePrevConditionalNodes(component, dynamicPod, activeIndex);
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

export function emitHookBatch(hookName: LifecycleHook, components: InternalComponent[]) {
    for (const compo of components) {
        compo.emit(hookName);
    }
}



export function vanishDOMNodes(nodePod: _NodePod, type: 'hide' | 'destroy' | 'preserve') {
    for (const nodeEntity of nodePod) {
        if (nodeEntity instanceof _DynamicNodePod) {
            for (const nodePod of nodeEntity) {
                vanishDOMNodes(nodePod, type) // What if there were components nested here? how do you unmount them?
            }
        }
        else if (type === 'destroy') {
            nodeEntity.remove()
        }
        else if (type === 'hide') {
            if (nodeEntity instanceof HTMLElement){ 
                nodeEntity.style.display = 'none'
            }
            else {
                nodeEntity //TODO:
            }
        }
    }
}

function removePrevConditionalNodes(component: InternalComponent, dynamicPod: _DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    const components = nodePod.componentsToUnmount;
    emitHookBatch(LifecycleHook.PREUNMOUNT, components!)
    component.emit(LifecycleHook.PREUPDATE)
    vanishDOMNodes(nodePod, 'destroy')
    emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    component.emit(LifecycleHook.UPDATED)
    dynamicPod.replaceNodePod(activeIndex, new _NodePod()); // clears previous
}

function hidePrevConditionalNodes(component: InternalComponent, dynamicPod: _DynamicNodePod, activeIndex: number) {
    const nodePod = dynamicPod[activeIndex];
    const components = nodePod.componentsToUnmount;
    emitHookBatch(LifecycleHook.PREUNMOUNT, components!)
    component.emit(LifecycleHook.PREUPDATE)
    vanishDOMNodes(nodePod, 'hide')
    emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    component.emit(LifecycleHook.UPDATED)
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


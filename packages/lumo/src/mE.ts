import { AnyObject, OptionalKeys } from "@rue/types";
import { Component, ComponentSetup, DOMNode, getCurrentComponent, InternalComponent, popComponent, pushComponent } from "./component";
import { hasSignal, ReactiveSignal } from "../../muonic/useDerivedSignal";
import { getWithoutTracking } from "../../muonic/DependencyTracker";
import { DynamicIndices, getCurrentItemAndIndex, insertAndMoveListItemNodes, ListRenderKit, removeListItemNodes } from "./forEachIn";
import { LifecycleHook, onBeforeUnmount, onUnmounted } from "./lifecycle";
import { _mountIf, genConditionsSignal, ConditionalKit, watchForRenderAndPreserve, watchRenderEffectAndPreserve, RenderConditional } from "../api-play/mountIf";
import { appendItems, copyAllBut, isEqual, normalizeToArray } from "@rue/utils";
import { diff } from "./diff";
import { isReactive } from "../../muonic/useReactivize";
import { _DynamicNodePod, _NodePod, NodePod } from "./NodePod";
import { _NodeRef, getNodeRef, NodeRef } from "./NodeRef";
import { useReactivity } from "../../muonic/useReactivity";
import { Signal } from "../../muonic/useSignalize";
import { getNodeConfig } from "./setUpNode";
import { ComponentConfig, ComponentOptions, makeComponent, RenderSlot } from "./mO";
import { watchRenderEffect, watchForRender } from "./watchForRender";
import { hideDOMNodes, setUpConditionalShowSeries } from "./showIf";
import { buildConditionalSeries, ConditionalRenderKit, ConditionalSeries, noElseBlock, validateStandAloneConditional } from "./$if";
import { initializeRef, JSXConfig, makeNode, NodeEntity, NodeSetupConfig } from "./makeNode";

export const _internalReactivity = useReactivity()

export type HTMLTag = keyof HTMLElementTagNameMap

export function mE(
    nodeType: HTMLTag,
    childNodes?: NodeEntity[],
    jsxConfig?: JSXConfig<HTMLElement>,
    setupConfig?: NodeSetupConfig,
): DOMNode {
    return makeNode(nodeType, childNodes, jsxConfig, setupConfig) as DOMNode
}

export function makeElement<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    childNodes: NodeEntity[] | undefined,
    jsxConfig: JSXConfig<HTMLElement>,
    setupConfig: NodeSetupConfig,
    ref: NodeRef<HTMLElement> | undefined,
    $index: Signal<number> | undefined
): DOMNode {

    const { class: classString, style: styleString, ...other } = jsxConfig;
    const { class: _class, on, style, assigned, ...attributes } = setupConfig;
    const { attributes: assignedAttributes, classes: assignedClasses, events: assignedEvents, styles: assignedStyles } = assigned || {};

    const domNode = document.createElement(tagName);
    const component = getCurrentComponent();
    if (!component) throw new Error("No component :(")

    if (ref) {
        const _ref = new _NodeRef(ref)
        _ref.assignValue(domNode, $index)
        initializeRef(component, _ref)
        _ref.castOnCreatedHook(domNode, $index)
    }

    if (childNodes) {
        const nodePod = new _NodePod();
        for (let i = 0; i < childNodes.length; i++) {
            let childNodeEntity = childNodes[i];
            if (childNodeEntity instanceof ConditionalRenderKit) {
                validateStandAloneConditional(childNodeEntity, childNodes, i);
                childNodeEntity = [childNodeEntity]
            }
            setUpNodeEntity(component, domNode, childNodeEntity, nodePod, undefined)
        }
    }

    if (on) {
        for (const event in on) {
            const handler = on[event]
            const _handler = $index ? (e: Event) => handler(e, $index()) : handler as EventListenerOrEventListenerObject
            domNode.addEventListener(event, _handler)
            onUnmounted(() => domNode.removeEventListener(event, _handler))
        }
    }

    if (_class) domNode.classList.value = _class

    if (style) {
        for (const property in style) {
            domNode.style[property] = style[property]!
        }
    }

    if (other) {
        for (const property in other) {
            domNode.setAttribute(property, other[property])
        }
    }



    // if (options) {
    //     const { main } = options
    //     if ('mountIf' in options) _mountIf(options.mountIf, { mount: () => makeElement(tagName, config, childNodes, ref, { main }) }) //TODO: not sure about main yet, do I store it on initialization or reset it on each new render?
    //     if ('showIf' in options);// TODO: showIf
    // }


    return domNode;
}



function setUpClasses(component: InternalComponent, node: HTMLElement, classes: (((o: DOMTokenList) => void) | string)[]) {
    const _watchRenderEffect = component.preserve ? watchRenderEffectAndPreserve : watchRenderEffect
    const classList = node.classList
    for (const entry of classes) {
        if (entry instanceof Function) {
            _watchRenderEffect(() => entry(classList))
        }
        else {
            if (__DEV__) warnDuplicateClasses(node.className, entry);
            node.className = node.className + " " + entry
        }
    }
}

function warnDuplicateClasses(classesA: string, classesB: string){
    const aClasses = new Set(classesA.split(' '))
    const bClasses = classesB.split(' ')
    for (const className of bClasses){
        if (aClasses.has(className)) {
            console.warn(`Duplicate class name: ${className}`);
            console.trace();
        }
    }
}

function setUpStyles(component: InternalComponent, node: HTMLElement, styles: (((o: CSSStyleDeclaration) => void | string))[]) {
    // if (nodeRef.initialized) return;
    const _watchRenderEffect = component.preserve ? watchRenderEffectAndPreserve : watchRenderEffect
    // if (!nodeRef) throw new Error(`nodeRef must be passed into mE to register dynamic styles`)
    // nodeRef.o.onCreated((node) => {
    const style = node.style;
    for (const entry of styles) {
        if (entry instanceof Function) {
            _watchRenderEffect(() => entry(style))
        }
        else {
            if (__DEV__) warnOverlappingStyles(style.cssText, entry);
            style.cssText = style.cssText + "; " + entry
        }
    }
    // })
}

function warnOverlappingStyles(stylesA: string, stylesB: string){
    const aStyles = new Set(stylesA.split('; '))
    const bStyles = stylesB.split('; ')
    for (const styling of bStyles){
        if (aStyles.has(styling)) {
            console.warn(`Duplicate styling: ${styling}`);
            console.trace();
        }
    }
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
    if (!component) throw new Error("No component found")
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
    else if (nodeEntity instanceof Array) {
        // conditional series
        const series = buildConditionalSeries(nodeEntity);
        setUpConditionalSeries(component, parent, series, nodePod, fragment)
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
    const nodeEntities = component.nodeEntities;
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
        const _watchForRender = component.preserve ? watchForRenderAndPreserve : watchForRender //TODO: Not sure if I need this yet

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


//    0                               1    2
// [[node, [maybe dynamic pod]], [ ], [ ]] --- dynamic pod
//  |                                 |
//  active pod                   inactive pod
//
// 
// [activeKit, kit, kit] --- conditionalKits
//

function setUpConditionalSeries(
    component: InternalComponent,
    parent: HTMLElement,
    series: ConditionalSeries,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
) {
    // evaluate conditions and render
    const { $conditions, activeIndex } = series.evaluateConditions()
    const initialNodeEntities = series.render(activeIndex)
    
    // append to dom and node pod
    const dynamicPod = nodePod.appendDynamicPod();
    const _nodePod = dynamicPod.appendNodePod()
    for (const nodeEntity of initialNodeEntities) {
        setUpNodeEntity(component, parent, nodeEntity, _nodePod, fragment, nodePod.componentsToUnmount)
    }

    // set up watcher for updates
    const _watchForRender = component.preserve ? watchForRenderAndPreserve : watchForRender
    _watchForRender($conditions, updateConditional, { once: true })

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        if (isEqual(newValue, oldValue)) return;

        // evaluate conditions
        const { $conditions, activeIndex } = series.evaluateConditions();

        // render and add/remove node pods
        component.emit(LifecycleHook.BEFORE_UPDATE)
        removePrevConditionalNodes(dynamicPod);
        const nodeEntities = series.render(activeIndex)
        insertNewConditionalNodes(component, parent, dynamicPod, nodeEntities)
        component.emit(LifecycleHook.UPDATED)

        // set up for next update
        pushComponent(component)
        _watchForRender($conditions, updateConditional, { once: true })
        popComponent()
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

export function removeDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        node.remove();
    })
}


export function populateFragment(fragment: DocumentFragment, nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        fragment.appendChild(node)
    })
}

const preservedNodePods: WeakMap<RenderConditional, _NodePod> = new WeakMap();

function getPreservedNodePod(renderConditional: RenderConditional) {
    const nodePod = preservedNodePods.get(renderConditional)
    if (!nodePod) throw new Error("nodePod missing")
    return nodePod;
}

function removePrevConditionalNodes(dynamicPod: _DynamicNodePod) {
    // component === App
    // const preserve = component.preserve;
    const nodePod = dynamicPod[0];
    const components = nodePod.componentsToUnmount;

    // if (preserve) {
    //     preservedNodePods.set(renderConditional, nodePod) // I don't think this is necessary...
    // }
    // else {
    emitBeforeUnmount(components)
    // }

    removeDOMNodes(nodePod)
    nullNodeRefValues(nodePod, components)
    // emitHookBatch(preserve ? LifecycleHook.DEACTIVATED : LifecycleHook.UNMOUNTED, components)
    emitUnmountedOrDeactivated(components)
    // dynamicPod.replaceNodePod(0, new _NodePod()); // clears previous
}

function emitUnmountedOrDeactivated(components: InternalComponent[]) {
    for (const component of components) {
        if (component.preserve) component.emit(LifecycleHook.DEACTIVATED);
        else component.emit(LifecycleHook.UNMOUNTED);
    }
}

function emitBeforeUnmount(components: InternalComponent[]) {
    for (const component of components) {
        if (component.preserve) continue;
        component.emit(LifecycleHook.BEFORE_UNMOUNT);
    }
}



function insertNewConditionalNodes(component: InternalComponent, parent: HTMLElement, dynamicPod: _DynamicNodePod, nodeEntities: NodeEntity[]) {
    // const nodePod = preserve ? getPreservedNodePod(renderConditional) : new _NodePod();
    const nodePod = new _NodePod();
    dynamicPod.replaceNodePod(0, nodePod);
    mountConditional(nodePod, component, parent, dynamicPod, nodeEntities);

    emitActivated(nodePod.componentsToUnmount)
    restoreNodeRefValues(nodePod, nodePod.componentsToUnmount)
}

export function mountConditional(nodePod: _NodePod, component: InternalComponent, parent: HTMLElement, dynamicPod: _DynamicNodePod, nodeEntities: NodeEntity[]) {
    const fragment = new DocumentFragment();

    for (const nodeEntity of nodeEntities) {
        setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount) //TODO: pass in index in case it's in a list?
    }

    let prevSibling = dynamicPod.prevNode;
    if (prevSibling) prevSibling.after(fragment)
    else parent.prepend(fragment)
}


function nullNodeRefValues(nodePod: _NodePod, components: Component[]) {
    nodePod.forEachNode(node => {
        const ref = getNodeRef(node);
        if (ref && ref.o.value) ref.setValue(null)
    })
    // for (const component of components){ //NOTE: Deferred until needed (see note in restoreNodeRefValues)
    //     const ref = getNodeRef(component);
    //     if (ref && ref.o.value) ref.setValue(null)
    // }
}

function restoreNodeRefValues(nodePod: _NodePod, components: Component[]) {
    nodePod.forEachNode((node, index) => {
        const ref = getNodeRef(node);
        if (ref) {
            if (index === undefined) ref.setValue(node);
            else ref.insertNode(node, index);
        }
    })
    // for (const component of components){ //NOTE: Deferred until needed: nulling and restoring node ref for components. Getting the correct index is tricky.
    //     const ref = getNodeRef(component);
    //     if (ref && ref.o.value) ref.setValue(component)
    // }
}

function emitActivated(components: InternalComponent[]) {
    for (const component of components) {
        if (component.preserve) component.emit(LifecycleHook.ACTIVATED);
    }
}




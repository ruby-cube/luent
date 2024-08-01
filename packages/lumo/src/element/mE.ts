import { PublicComponent, ComponentSetup, DOMNode, getCurrentComponent, InternalComponent, popComponent, pushComponent } from "../component/component";
import { DerivedSignal, hasSignal, ReactiveSignal } from "@rue/muonic/DerivedSignal";
import { getWithoutTracking } from "@rue/muonic/DependencyTracker";
import { appendItems, copyAllBut, isEqual, normalizeToArray } from "@rue/utils";
import { _DynamicNodePod, _NodePod, NodePod } from "../node/NodePod";
import { InternalNodeRef, getNodeRef, NodeRef } from "../node/NodeRef";
import { Signal, useSignals } from "@rue/muonic/useSignals";
import { analyzeAttributes } from "../component/mO";
import { watchRenderEffect, watchForRender } from "../reactivity/watchForRender";
import { buildConditionalSeries, ConditionalRenderKit, ConditionalSeries, noElseBlock, RenderConditional, validateStandAloneConditional, watchForRenderAndPreserve, watchRenderEffectAndPreserve } from "../conditional/$if";
import { ElementConfig, initializeRef, makeNode, NodeEntity } from "../node/makeNode";
import { ActiveListener, PendingOp } from "@rue/flask";
import { useEventTick } from "./EventTick";
import { runNonSyncTasks } from "@rue/muonic";
import { setUpNodeEntity } from "../node/setUpNodeEntity";
import { beforeUnmount } from "../component/lifecycle";


export type HTMLTag = keyof HTMLElementTagNameMap

export function mE(
    nodeType: HTMLTag,
    childNodes?: NodeEntity[],
    config?: ElementConfig,
): DOMNode {
    return makeNode(nodeType, childNodes, config) as DOMNode
}

export function makeElement<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    childNodes: NodeEntity[] | undefined,
    config: ElementConfig,
    $index: Signal<number> | undefined
): DOMNode {
    const { class: classes, style: styles, ref, attributes: attributeChanges, ...other } = config;

    const { attributes, events } = analyzeAttributes(other)

    const domNode = document.createElement(tagName);
    const component = getCurrentComponent();
    if (!component) throw new Error("No component :(")

    if (ref) {
        const _ref = ref.o instanceof Array ? getNodeRef(ref.o)! : new InternalNodeRef(ref)
        _ref.assignValue(domNode, $index)
        initializeRef(_ref)
    }

    if (childNodes) {
        const _childNodes = wrapIfConditionalSeries(childNodes)
        const nodePod = new _NodePod();
        for (let i = 0; i < _childNodes.length; i++) {
            let childNodeEntity = _childNodes[i];
            if (childNodeEntity instanceof ConditionalRenderKit) {
                validateStandAloneConditional(childNodeEntity, _childNodes, i);
                childNodeEntity = [childNodeEntity]
            }
            setUpNodeEntity(component, domNode, childNodeEntity, nodePod, undefined)
        }
    }

    setUpClasses(component, domNode, normalizeToArray(classes))
    setUpStyles(component, domNode, normalizeToArray(styles))
    setUpEvents(domNode, events);
    setUpAttributes(domNode, attributes);
    if (attributeChanges)
        setUpAttributeChanges(
            domNode,
            //@ts-expect-error
            attributeChanges
        );

    return domNode;
}

function wrapIfConditionalSeries(nodeEntities: NodeEntity[]) {
    if (isNotConditionalSeries(nodeEntities)) {
        return nodeEntities;
    }
    validateConditionalSeries(nodeEntities, false)
    return [nodeEntities];
}


function isNotConditionalSeries(nodeEntities: NodeEntity[]) {
    return !(nodeEntities[0] instanceof ConditionalRenderKit) ||
        !(nodeEntities[nodeEntities.length - 1] instanceof ConditionalRenderKit)
}

function validateConditionalSeries(nodeEntities: ConditionalRenderKit[], isNotConditionalSeries: false) {
    if (isNotConditionalSeries !== false)
        throw new Error(`validateConditionalSeries must be called after isNotConditionalSeries`)
    if (nodeEntities[0].statement !== 'if' || nodeEntities[nodeEntities.length - 1].statement === 'if')
        throw new Error("Invalid conditional series")
    for (let i = 1; i < nodeEntities.length - 1; i++) {
        const nodeEntity = nodeEntities[i];
        if (!(nodeEntity instanceof ConditionalRenderKit) || nodeEntity.statement === 'if' || nodeEntity.statement == 'else')
            throw new Error("Invalid conditional series")
    }
}

function setUpAttributes(node: Element, attributes: { [key: string]: any | DerivedSignal<any> }) {
    for (const key in attributes) {
        const value = attributes[key]
        if (hasSignal(value)) {
            watchForRender(value, (newValue) => { //TODO: only attributes that affect layout should be scheduled for render
                setAttribute(node, key, newValue)
            }, { eager: true })
        }
        else {
            node.setAttribute(key, toString(value))
        }
    }
}

function setAttribute(node: Element, key: string, value: any) {
    if (value) {
        node.setAttribute(key, toString(value))
    }
    else {
        node.removeAttribute(key);
    }
}


function setUpEvents(node: Element, events: { [key: string]: (EventListener | DerivedSignal<EventListener | null>)[] }) {
    for (const key in events) {
        const handlers = normalizeToArray(events[key]);
        const event = useEventTick(node, key, () => runNonSyncTasks('pre'));
        event.updateHandlers(() => {
            for (const handler of handlers) {
                if (hasSignal(handler)) {
                    let listener: ActiveListener;
                    watchForRender(handler, (newValue) => {
                        event.updateHandlers(() => {
                            if (listener) {
                                listener.stop();
                            }
                            if (newValue) {
                                listener = event.attachHandler(newValue, {});
                            }
                        })
                    }, { eager: true })
                }
                else {
                    event.attachHandler(handler, {})
                }
            }
        })
    }
}



type DynamicClassesConfig = {
    [key: string]: ReactiveSignal<boolean>;
}

function setUpClasses(component: InternalComponent, node: Element, classes: (((o: DOMTokenList) => void) | string | DynamicClassesConfig)[]) {
    const _watchRenderEffect = component.preserve ? watchRenderEffectAndPreserve : watchRenderEffect
    const classList = node.classList
    for (const entry of classes) {
        if (entry instanceof Function) {
            _watchRenderEffect(() => entry(classList))
        }
        else if (entry instanceof Object) {
            for (const key in entry) {
                const $signal = entry[key];
                watchForRender($signal, (value) => { //QUESTION: should this have a preserve version?
                    if (value) classList.add(key);
                    else classList.remove(key);
                }, { eager: true })
            }
        }
        else {
            if (__DEV__ && entry) warnDuplicateClasses(node.className, entry);
            node.className = node.className + " " + entry
        }
    }
}

function warnDuplicateClasses(classesA: string, classesB: string) {

    const aClasses = new Set(classesA.split(' '))
    const bClasses = classesB.split(' ')
    for (const className of bClasses) {
        if (aClasses.has(className)) {
            console.warn(`Duplicate class name: ${className}`);
            console.trace();
        }
    }
}

function setUpStyles(component: InternalComponent, node: HTMLElement, styles: (((o: CSSStyleDeclaration) => void) | string)[]) {
    const _watchRenderEffect = component.preserve ? watchRenderEffectAndPreserve : watchRenderEffect
    const style = node.style;
    for (const entry of styles) {
        if (entry instanceof Function) {
            _watchRenderEffect(() => entry(style))
        }
        else {
            if (__DEV__ && entry) warnOverlappingStyles(style.cssText, normalizeStyle(entry));
            style.cssText = style.cssText + "; " + normalizeStyle(entry)
        }
    }
}

function normalizeStyle(statement: string) {
    statement.trim();
    if (statement.endsWith(';')) return statement.substring(0, statement.length - 1);
    return statement;
}

function warnOverlappingStyles(stylesA: string, stylesB: string) {
    const aStyles = new Set(stylesA.split('; '))
    const bStyles = stylesB.split('; ')
    for (const styling of bStyles) {
        if (aStyles.has(styling)) {
            console.warn(`Duplicate styling: ${styling}`);
            console.trace();
        }
    }
}

function setUpAttributeChanges(node: Element, changes: ((o: Element) => void)[] | ((o: Element) => void)) {
    if (changes instanceof Function) {
        watchRenderEffect(() => changes(node)) // watchAndPreserve?
    }
    else {
        for (const change of changes) {
            watchRenderEffect(() => change(node))
        }
    }
}

function setUpRefNulling(ref: _NodePod, $index: Signal<number>) {
    if ($index && $index() === 0) {

    }
    else {
        beforeUnmount(() => {

        })
    }
}

export function setUpTextNode(parent: Element, text: ReactiveSignal | any, nodePod?: _NodePod, fragment?: DocumentFragment) {

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

// function mountDOMNode(parent: Element, node: DOMNode, prevSibling?: DOMNode | null) {
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

// function mountElement(parent: DOMNode, node: DOMNode) {
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




export function mountElement(parent: Element, node: DOMNode, nodePod: _NodePod, fragment?: DocumentFragment) {
    nodePod.appendStaticNode(node)
    const root = fragment ? fragment : parent;
    root.appendChild(node)
}




//    0                               1    2
// [[node, [maybe dynamic pod]], [ ], [ ]] --- dynamic pod
//  |                                 |
//  active pod                   inactive pod
//
// 
// [activeKit, kit, kit] --- conditionalKits
//


import { DOMNode, Slot } from "../component/InternalComponent";
import { DerivedIon, ReactiveGet, isIon, getCurrentRenderCycle, Phase, isAtomicIon, AtomicIon } from "../../../quarky/src";
import { noop, normalizeToArray } from "@rue/utils";
import { _DynamicNodePod, _NodePod, NodePod } from "../node/NodePod";
import { initializeRender, watch } from "../watch/watchAndPreserve";
import { ElementConfig,  makeNode, NodeEntity } from "../node/makeNode";
import { $listen, ActiveListener, ListenerOptions, PendingOp } from "@rue/flask";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { isHydrating } from "../hydration/hydration";
import { getElement } from "../hydration/getElement";
import { AnyObject, Booleanny } from "@rue/types";
import { isHTMLEvent } from "../html/attributes";
import { setUpNodeEntities } from "../node/setUpNodeEntities";
import { initializeListRef, initializeRef, isNodeRef, NodesRef } from "../node/NodeRef";



export type HTMLTag = keyof HTMLElementTagNameMap

export function mE(
    nodeType: HTMLTag,
    Slot?: () => NodeEntity[],
    config?: ElementConfig,
): DOMNode {
    return makeNode(nodeType, Slot, config || {}) as DOMNode
}

export function makeElement<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    Slot: Slot | undefined,
    config: ElementConfig,
    $index: AtomicIon<number> | undefined
): DOMNode {
    const { class: classes, style: styles, ref, attributes: dynamicAttributes, ...other } = config;

    const { attributes, events } = analyzeAttributes(other)

    const domNode = isHydrating() ? getElement() : document.createElement(tagName);

    if (ref) {
        if (!isNodeRef(ref)) throw new Error("INVALID INPUT: Must use NodeRef or NodesRef as ref")
        if ($index) {
            initializeListRef(<NodesRef>ref, domNode, $index)
        }
        else {
            initializeRef(ref, domNode)
        }
    }

    setUpClasses(domNode, normalizeToArray(classes))
    setUpStyles(domNode, normalizeToArray(styles))
    setUpEvents(domNode, events);
    setUpAttributes(domNode, attributes);
    if (dynamicAttributes)
        setUpDynamicAttributes(
            domNode,
            //@ts-expect-error
            dynamicAttributes
        );

    if (Slot) {
        const rawOutput = normalizeToArray(Slot instanceof Function ? Slot() : Slot)
        const nodePod = new _NodePod();
        const nodeEntities = setUpNodeEntities(rawOutput, domNode, nodePod)
        mountNodeEntities(nodeEntities, domNode)
    }
    return domNode;
}



// function wrapIfConditionalSeries(nodeEntities: NodeEntity[]) {
//     if (isNotConditionalSeries(nodeEntities)) {
//         return nodeEntities;
//     }
//     validateConditionalSeries(nodeEntities, false)
//     return [nodeEntities];
// }


// function isNotConditionalSeries(nodeEntities: NodeEntity[]) {
//     return !(nodeEntities[0] instanceof ConditionalRenderKit) ||
//         !(nodeEntities[nodeEntities.length - 1] instanceof ConditionalRenderKit)
// }

// function validateConditionalSeries(nodeEntities: ConditionalRenderKit[], isNotConditionalSeries: false) {
//     if (isNotConditionalSeries !== false)
//         throw new Error(`validateConditionalSeries must be called after isNotConditionalSeries`)
//     if (nodeEntities[0].statementType !== 'if' || nodeEntities[nodeEntities.length - 1].statementType === 'if')
//         throw new Error("Invalid conditional series")
//     for (let i = 1; i < nodeEntities.length - 1; i++) {
//         const nodeEntity = nodeEntities[i];
//         if (!(nodeEntity instanceof ConditionalRenderKit) || nodeEntity.statementType === 'if' || nodeEntity.statementType == 'else')
//             throw new Error("Invalid conditional series")
//     }
// }

function analyzeAttributes(entries: AnyObject) {
    const events: AnyObject = {};
    // const jsxProps: AnyObject = {};
    const attributes: AnyObject = {};
    for (const key in entries) {
        if (key === "children") {
            continue;
        }
        else if (isHTMLEvent(key)) {
            events[key.slice(3)] = entries[key];
        }
        // else if (isHTMLAttribute(key, tag)) {
        // }
        else {
            attributes[key] = entries[key];
            // jsxProps[key] = jsxEntries[key];
        }
    }
    return {
        attributes,
        events,
        // jsxProps
    }
}

function setUpAttributes(node: Element, attributes: { [key: string]: any | DerivedIon<any> }) {
    for (const key in attributes) {
        const value = attributes[key]
        //TODO: only attributes that affect layout should be scheduled for render
        if (isIon(value)) {
            watch(value, (newValue) => {
                setAttribute(node, key, newValue)
            }, { eager: true, phase: Phase.RENDER })
        }
        else if (!isHydrating()) {
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

function toString(value: any) {
    return value.toString(); //TODO: make sure it works with any value
}

//TODO: figure out how to incorporate options into inline events
function setUpEvents(node: Element, events: { [key: string]: EventListener[] }, options?: ListenerOptions & AddEventListenerOptions) {
    for (const key in events) {
        const handlers = normalizeToArray(events[key]);
        for (const handler of handlers) {
            return $listen(handler, options || {}, {
                enroll: (cb) => {
                    node.addEventListener(key, cb, options);
                },
                remove: (cb) => {
                    node.removeEventListener(key, cb, options);
                }
            })
        }

    }
}



type DynamicClassesConfig = {
    [key: string]: ReactiveGet<Booleanny>;
}

function setUpClasses(node: Element, classes: (((o: DOMTokenList) => void) | string | DynamicClassesConfig)[]) {
    const classList = node.classList
    for (const entry of classes) {
        if (entry instanceof Function) {
            initializeRender(() => entry(classList))
        }
        else if (entry instanceof Object) {
            for (const key in entry) {
                const $ion = entry[key];
                watch($ion, (value) => { //QUESTION: should this have a preserve version?
                    if (value) classList.add(key);
                    else classList.remove(key);
                }, { eager: true, phase: Phase.RENDER })
            }
        }
        else if (!isHydrating()) {
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

function setUpStyles(node: Element, styles: (((o: CSSStyleDeclaration) => void) | string)[]) {
    const style = (<HTMLElement | SVGAElement | MathMLElement>node).style;
    for (const entry of styles) {
        if (entry instanceof Function) {
            initializeRender(() => entry(style))
        }
        else if (!isHydrating()) {
            if (__DEV__ && entry) warnOverlappingStyles(style.cssText, normalizeStyle(entry));
            style.cssText = style.cssText + "; " + normalizeStyle(entry)
        }
    }
}

function normalizeStyle(expression: string) {
    expression.trim();
    if (expression.endsWith(';')) return expression.substring(0, expression.length - 1);
    return expression;
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

function setUpDynamicAttributes(node: Element, changes: ((o: Element) => void)[] | ((o: Element) => void)) {
    if (changes instanceof Function) {
        initializeRender(() => changes(node)) // watchAndPreserve?
    }
    else {
        for (const change of changes) {
            initializeRender(() => change(node))
        }
    }
}

// function setUpRefNulling(ref: _NodePod, $index: AtomicIon<number>) {
//     if ($index && $index() === 0) {

//     }
//     else {
//         onDeactivate(() => {

//         })
//     }
// }







//    0                               1    2
// [[node, [maybe dynamic pod]], [ ], [ ]] --- dynamic pod
//  |                                 |
//  active pod                   inactive pod
//
// 
// [activeKit, kit, kit] --- conditionalKits
//


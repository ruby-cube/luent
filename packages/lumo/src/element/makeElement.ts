import { PublicComponent, ComponentSetup, DOMNode, InternalComponent, getComponent} from "../component/InternalComponent";
import { DerivedSignal, hasSignal, ReactiveSignal, _runTasks, Hooks } from "@rue/muonic";
import { normalizeToArray } from "@rue/utils";
import { _DynamicNodePod, _NodePod, NodePod } from "../node/NodePod";
import { InternalNodeRef, get$Node, getNodeRef } from "../node/$Node";
import { initializeRender, watchForRender } from "../watch/watchForRender";
import { ElementConfig, initializeListRef, initializeRef, makeNode, NodeEntity } from "../node/makeNode";
import { ActiveListener, PendingOp } from "@rue/flask";
import { useEventTick } from "./EventTick";
import { runNonSyncTasks, Signal } from "@rue/muonic";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { validateStandAloneConditional } from "../conditional/ConditionalSeries";
import { isHydrating } from "../hydration/hydration";
import { getElement } from "../hydration/getElement";
import { AnyObject, Booleanny } from "@rue/types";
import { isHTMLEvent } from "../html/attributes";
import { getCurrentComponent } from "../component/componentStack";
import { getActiveDynamicNode } from "../dynamic/DynamicNode";
import { onDeactivate } from "../dynamic/lifecycle";


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
    const { class: classes, style: styles, ref, attributes: dynamicAttributes, ...other } = config;

    const { attributes, events } = analyzeAttributes(other)

    const component = getComponent(makeElement.name)

    const domNode = isHydrating() ? getElement() : document.createElement(tagName);

    if (ref) {
        if ($index) initializeListRef(ref, domNode, $index)
        else initializeRef(ref, domNode)
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
            mountNodeEntity(domNode, childNodeEntity, nodePod, undefined)
        }
    }

    setUpClasses(component, domNode, normalizeToArray(classes))
    setUpStyles(component, domNode, normalizeToArray(styles))
    setUpEvents(domNode, events);
    setUpAttributes(domNode, attributes);
    if (dynamicAttributes)
        setUpDynamicAttributes(
            domNode,
            //@ts-expect-error
            dynamicAttributes
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
    if (nodeEntities[0].statementType !== 'if' || nodeEntities[nodeEntities.length - 1].statementType === 'if')
        throw new Error("Invalid conditional series")
    for (let i = 1; i < nodeEntities.length - 1; i++) {
        const nodeEntity = nodeEntities[i];
        if (!(nodeEntity instanceof ConditionalRenderKit) || nodeEntity.statementType === 'if' || nodeEntity.statementType == 'else')
            throw new Error("Invalid conditional series")
    }
}

function analyzeAttributes(entries: AnyObject) {
    const events: AnyObject = {};
    // const jsxProps: AnyObject = {};
    const attributes: AnyObject = {};
    for (const key in entries) {
        if (key === "children") {
            continue;
        }
        else if (isHTMLEvent(key)) {
            events[key.slice(2)] = entries[key];
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

function setUpAttributes(node: Element, attributes: { [key: string]: any | DerivedSignal<any> }) {
    for (const key in attributes) {
        const value = attributes[key]
        if (hasSignal(value)) {
            watchForRender(value, (newValue) => { //TODO: only attributes that affect layout should be scheduled for render
                setAttribute(node, key, newValue)
            }, { eager: true })
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


function setUpEvents(node: Element, events: { [key: string]: (EventListener | DerivedSignal<EventListener | null>)[] }) {
    for (const key in events) {
        const handlers = normalizeToArray(events[key]);
        const event = useEventTick(node, key, () => {
            runNonSyncTasks('pre');
            _runTasks(Hooks.AFTER_PRERENDER_PHASE)
        });
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
                                listener = event.attachHandler(newValue, newValue.options || {});
                            }
                        })
                    }, { eager: true })
                }
                else {
                    event.attachHandler(handler, handler.options || {})
                }
            }
        })
    }
}



type DynamicClassesConfig = {
    [key: string]: ReactiveSignal<Booleanny>;
}

function setUpClasses(component: InternalComponent, node: Element, classes: (((o: DOMTokenList) => void) | string | DynamicClassesConfig)[]) {
    const classList = node.classList
    for (const entry of classes) {
        if (entry instanceof Function) {
            initializeRender(() => entry(classList))
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

function setUpStyles(component: InternalComponent, node: Element, styles: (((o: CSSStyleDeclaration) => void) | string)[]) {
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

function setUpRefNulling(ref: _NodePod, $index: Signal<number>) {
    if ($index && $index() === 0) {

    }
    else {
        onDeactivate(() => {

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


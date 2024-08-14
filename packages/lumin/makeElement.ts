import { analyzeAttributes, ElementConfig } from "@rue/lumo";
import { HTMLString } from "./makeNode";
import { normalizeToArray } from "@rue/utils";
import { ReactiveSignal } from "../muonic";
import { buildElementString } from "./buildElement";

export type HTMLTag = keyof HTMLElementTagNameMap

export function makeElement<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    childNodes: string[] | undefined,
    config: ElementConfig,
): HTMLString {
    const { class: classes, style: styles, ref, attributes: attributeChanges, ...other } = config;

    const { attributes, events } = analyzeAttributes(other)

    const domNode = document.createElement(tagName);
    const component = getCurrentComponent();
    if (!component) throw new Error("No component :(")


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

    setUpClasses(domNode, normalizeToArray(classes))
    setUpStyles(component, domNode, normalizeToArray(styles))
    setUpAttributes(domNode, attributes);
    if (attributeChanges)
        setUpAttributeChanges(
            domNode,
            //@ts-expect-error
            attributeChanges
        );

    return buildElementString(tagName, _childNodes, _classes, _styles, _attributes);
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
    if (nodeEntities[0].statementType !== 'if' || nodeEntities[nodeEntities.length - 1].statementType=== 'if')
        throw new Error("Invalid conditional series")
    for (let i = 1; i < nodeEntities.length - 1; i++) {
        const nodeEntity = nodeEntities[i];
        if (!(nodeEntity instanceof ConditionalRenderKit) || nodeEntity.statementType === 'if' || nodeEntity.statementType == 'else')
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
    [key: string]: ReactiveSignal<boolean>;
}

function setUpClasses(node: Element, classes: (((o: DOMTokenList) => void) | string | DynamicClassesConfig)[]) {
    const classList = node.classList //TODO: Create a mock classList with add and remove
    for (const entry of classes) {
        if (entry instanceof Function) {
            entry(classList)
        }
        else if (entry instanceof Object) {
            for (const key in entry) {
                const $signal = entry[key];
                const value = $signal();
                    if (value) classList.add(key);
                    else classList.remove(key);
            }
        }
        else {
            if (__DEV__ && entry) warnDuplicateClasses(node.className, entry);
            node.className = node.className + " " + entry //TODO: mock node class name
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
    const _initializeRender = component.preserve ? initializeRenderAndPreserve : initializeRender
    const style = node.style;
    for (const entry of styles) {
        if (entry instanceof Function) {
            _initializeRender(() => entry(style))
        }
        else {
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

function setUpAttributeChanges(node: Element, changes: ((o: Element) => void)[] | ((o: Element) => void)) {
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


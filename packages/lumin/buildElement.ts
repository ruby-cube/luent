import { ElementConfig } from "@rue/lumo";
import { HTMLString } from "./makeNode";

type NodeEntity = HTMLString | HTMLString[] // array of strings for components, conditionals, and lists

export function buildElementString<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    childNodes?: NodeEntity[],
    classes?: string,
    styles?: string,
    attributes?: { [key: string]: string | boolean }
) {
    let elementString = "<" + tagName;
    if (classes) {
        elementString += `class='${classes}`
    }
    if (styles) {
        elementString += `style='${styles}`
    }
    if (attributes) {
        elementString = appendAttributes(elementString, attributes)
    }
    if (isSelfClosing(tagName)) {
        elementString += "/>"
    }
    else {
        elementString += ">"
        if (childNodes) {
            elementString = appendChildNodes(elementString, childNodes);
        }
        elementString += `</${tagName}>`
    }
    return elementString;
}

function appendAttributes(element: string, attributes: { [key: string]: string | boolean }) {
    for (const key in attributes) {
        const value = attributes[key];
        if (value && typeof value === 'string') {
            element += " " + key + "='" + value + "'"
        }
        else if (value === true) {
            element += " " + key;
        }
    }
    return element;
}

function appendChildNodes(element: string, childNodes: NodeEntity[]) {
    for (const childNode of childNodes) {
        if (typeof childNode === 'string') {
            element += childNode;
        }
        else if (childNode instanceof Array) {
            element = appendChildNodes(element, childNode);
        }
    }
    return element;
}

const selfClosingTags = {
    area: 1,
    base: 1,
    br: 1,
    col: 1,
    embed: 1,
    hr: 1,
    img: 1,
    input: 1,
    link: 1,
    meta: 1,
    source: 1,
    track: 1,
    wbr: 1
};

function isSelfClosing(tag: string) {
    return tag in selfClosingTags;
}
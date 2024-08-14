import { getAppRoot } from "../createApp";

let prevElement: Element | undefined;

export function getElement() {
    const appRoot = getAppRoot()
    let element;
    if (!prevElement) {
        element = findLeaf(appRoot)
        prevElement = element;
    }
    else if (element = prevElement.nextElementSibling) {
        prevElement = element;
    }
    else if (element = prevElement.parentElement) {
        prevElement = element;
    }
    if (element === appRoot) throw new Error(`Element is app root. This should never happen`)
    if (!element) throw new Error(`No element... This should never happen`)
    if (element.parentElement === appRoot && !element.nextElementSibling) {
        prevElement = undefined; // hydration completed
    }
    return element;
}

function findLeaf(element: Element) {
    const firstChild = element.firstChild;
    if (firstChild) {
        return findLeaf(element);
    }
    return element;
}



let hydrating = false;

export function isHydrating() {
    return hydrating;
}
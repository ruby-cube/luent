import { getAppRoot } from "../createRoot";
import { endHydration } from "./hydration";

// To hydrate the DOM tree, we start with the left-most leaf
// and proceed to its siblings, then its parent.
// This is the same order that elements are created in the component tree.
// Finally, when there is no next sibling and the parent is the app root,
// we have completed traversing the DOM tree.

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
        prevElement = undefined;
        endHydration();
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
import { isIon, __DEV__checkIfTracked, watch, Ion, toValue } from "@rue/quarky";
import { INTERNAL_RENDER, PRERENDER, queueInternalRenderTask, watchToRender } from "../render-cycle";
import { getActiveFlask, getFlask } from "@rue/flask";



// export function setUpTextNode(text: Ion | any, textNode: Text) {
//    if (isIon(text)) {
//       keepTextNodeUpdated(text, textNode)
//    }
//    return textNode;
// }

// export function mountTextNode(textNode: CharacterData, parent: Element, fragment?: DocumentFragment) {
//    const root = fragment ? fragment : parent;
//    root.appendChild(textNode)
// }

// function keepTextNodeUpdated(text: Ion, textNode: CharacterData) {
//    const flask = getFlask()
//    watchToRender(text, () => {
//       queueInternalRenderTask(() => {
//          textNode.data = toString(text());
//       }, flask)
//    }, flask);
// }


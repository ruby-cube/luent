import { isIon, __devCheckIfTracked, watch, Ion } from "@rue/quarky";
import { NodePod } from "./NodePod";
import { RENDER } from "../render/render-cycle";



export function setUpTextNode(text: Ion | any, nodePod: NodePod) {
    const textNode = createTextNode(text); //QUESTION: In cases of empty string, should textNode be created? What is more important... clean HTML or less DOM manipulations?

    nodePod.push(textNode)

    if (isIon(text)) {

        keepTextNodeUpdated(text, textNode)
    }
    return textNode;
}

export function mountTextNode(textNode: CharacterData, parent: Element, fragment?: DocumentFragment) {
   const root = fragment ? fragment : parent;
   root.appendChild(textNode)
}

function keepTextNodeUpdated(text: Ion, textNode: CharacterData) {
   watch(text, ({state}) => {
      // if (typeof state === 'number')console.log('index?', text)
      textNode.data = toString(state);
   }, { phase: RENDER, __devName: keepTextNodeUpdated.name });
}


function createTextNode(value: Ion | any) {
    if (__DEV__) __devCheckIfTracked()
    const _value = isIon(value) ? value() : value;
    const text = toString(_value)
    const textNode = document.createTextNode(text);
    return textNode;
}


function toString(value: any) {
    return value.toString(); //TODO: make sure it works with any value
}
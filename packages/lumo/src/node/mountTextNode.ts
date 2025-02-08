import { isIon, ReactiveGet, Phase, tracked, __devCheckIfTracked, watch } from "@rue/quarky";
import { NodePod } from "./NodePod";



export function setUpTextNode(text: ReactiveGet | any, nodePod: NodePod) {
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

function keepTextNodeUpdated(text: ReactiveGet<any>, textNode: CharacterData) {
   watch(text, ({newState}) => {
      textNode.data = toString(newState);
   }, { phase: Phase.RENDER, __devName: keepTextNodeUpdated.name });
}


function createTextNode(value: ReactiveGet | any) {
    if (__DEV__) __devCheckIfTracked()
    const _value = isIon(value) ? value() : value;
    const text = toString(_value)
    const textNode = document.createTextNode(text);
    return textNode;
}


function toString(value: any) {
    return value.toString(); //TODO: make sure it works with any value
}
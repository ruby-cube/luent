import { isIon, ReactiveGet, Phase, tracked, __devCheckIfTracked } from "../../../quarky/src";
import { _NodePod } from "./NodePod";
import { watch } from "../watch/watchAndPreserve";

export function mountTextNode(parent: Element, text: ReactiveGet | any, nodePod?: _NodePod, fragment?: DocumentFragment) {
    const textNode = createTextNode(text); //QUESTION: In cases of empty string, should textNode be created? What is more important... clean HTML or less DOM manipulations?
   
    if (nodePod) {
        nodePod.appendStaticNode(textNode)
    }

    const root = fragment ? fragment : parent;
    root.appendChild(textNode)

    if (isIon(text) || text instanceof Function) {
        keepTextNodeUpdated(text, textNode)
    }
}

function keepTextNodeUpdated(text: ReactiveGet<any>, textNode: CharacterData) {
    watch(text, (newValue: any) => {
        textNode.data = toString(newValue);
    }, { phase: Phase.RENDER, __devName: keepTextNodeUpdated.name });
}



function createTextNode(value: ReactiveGet | any) {
    if (__DEV__) __devCheckIfTracked()
        const _value = isIon(value) || value instanceof Function ? value() : value;
    const text = toString(_value)
    const textNode = document.createTextNode(text);
    return textNode;
}


function toString(value: any) {
    return value.toString(); //TODO: make sure it works with any value
}
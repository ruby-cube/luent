import { getWithoutTracking, isReactiveGet, ReactiveGet, Phase } from "@rue/muonic";
import { _NodePod } from "./NodePod";
import { watch} from "../watch/watchAndPreserve";

export function mountTextNode(parent: Element, text: ReactiveGet | any, nodePod?: _NodePod, fragment?: DocumentFragment) {

    const textNode = createTextNode(text); //QUESTION: In cases of empty string, should textNode be created? What is more important... clean HTML or less DOM manipulations?
    if (nodePod) {
        nodePod.appendStaticNode(textNode)
    }

    const root = fragment ? fragment : parent;
    root.appendChild(textNode)

    if (isReactiveGet(text)) {
        keepTextNodeUpdated(text, textNode)
    }
}

function keepTextNodeUpdated($text: ReactiveGet<any>, textNode: CharacterData) {
    watch($text, (newValue: any) => {
        textNode.data = toString(newValue);
    }, { phase: Phase.RENDER, __devName: keepTextNodeUpdated.name });
}



function createTextNode(value: ReactiveGet | any) {
    const _value = isReactiveGet(value) ? getWithoutTracking(value) : value;
    const text = toString(_value)
    const textNode = document.createTextNode(text);
    return textNode;
}


function toString(value: any) {
    return value.toString(); //TODO: make sure it works with any value
}
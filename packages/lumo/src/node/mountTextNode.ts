import { getWithoutTracking, hasSignal, ReactiveSignal } from "@rue/muonic";
import { _NodePod } from "./NodePod";
import { watchForRenderAndPreserve } from "../conditional/$if";
import { watchForRender } from "../reactivity/watchForRender";
import { getCurrentComponent } from "../component/componentStack";
import { InternalComponent } from "../component/InternalComponent";

export function mountTextNode(parent: Element, text: ReactiveSignal | any, nodePod?: _NodePod, fragment?: DocumentFragment) {

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

function keepTextNodeUpdated($text: ReactiveSignal<any>, textNode: CharacterData) {
    const component = getCurrentComponent<InternalComponent>();
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
import { isIon, __devCheckIfTracked, watch, Ion } from "@rue/quarky";
import { NodePod } from "./NodePod";
import { RENDER } from "../render-cycle";



export function setUpTextNode(text: Ion | any, nodePod: NodePod) {
   const textNode = createTextNode(text); //QUESTION: In cases of empty string, should textNode be created? What is more important... clean HTML or less DOM manipulations?

   nodePod.push(textNode)

   if (isIon(text)) {
      console.log('isIon', text)
      keepTextNodeUpdated(text, textNode)
   }
   return textNode;
}

export function mountTextNode(textNode: CharacterData, parent: Element, fragment?: DocumentFragment) {
   const root = fragment ? fragment : parent;
   root.appendChild(textNode)
}

function keepTextNodeUpdated(text: Ion, textNode: CharacterData) {
   watch(text, ({ current }) => {
      textNode.data = toString(current);
   }, { phase: RENDER });
}


function createTextNode(value: Ion | any) {
   if (__DEV__) __devCheckIfTracked()
   const _value = isIon(value) ? value() : value;
   const text = toString(_value)
   const textNode = document.createTextNode(text);
   return textNode;
}


function toString(value: any) {
   if (value === undefined) return '';
   return value.toString(); //TODO: make sure it works with any value
}
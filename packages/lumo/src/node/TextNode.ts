import { isIon, __devCheckIfTracked, watch, Ion, toValue } from "@rue/quarky";
import { INTERNAL_RENDER, PRERENDER, queueInternalRender, watchForRender } from "../render-cycle";
import { getActiveFlask } from "@rue/flask";
import { getViewFlask } from "../flask/ViewFlask";



export function setUpTextNode(text: Ion | any, textNode: Text) {
   if (isIon(text)) {
      keepTextNodeUpdated(text, textNode)
   }
   return textNode;
}

// export function mountTextNode(textNode: CharacterData, parent: Element, fragment?: DocumentFragment) {
//    const root = fragment ? fragment : parent;
//    root.appendChild(textNode)
// }

function keepTextNodeUpdated(text: Ion, textNode: CharacterData) {
   const flask = getViewFlask()
   watchForRender(text, () => {
      queueInternalRender(() => {
         textNode.data = toString(text());
      }, flask)
   }, flask);
}


export function createTextNode(value: Ion | any) {
   //QUESTION: In cases of empty string, should textNode be created? What is more important... clean HTML or less DOM manipulations?
   if (__DEV__) __devCheckIfTracked()
   const text = toString(toValue(value))
   return document.createTextNode(text);
}


function toString(value: any) {
   if (value === undefined) return '';
   if (value instanceof Object) return JSON.stringify(value);
   return value.toString(); //TODO: make sure it works with any value
}
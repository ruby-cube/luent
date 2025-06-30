import { isIon, __devCheckIfTracked, watch, Ion, toValue } from "@rue/quarky";



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
   watch(text, ({ current }) => {
      textNode.data = toString(current);
   });
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
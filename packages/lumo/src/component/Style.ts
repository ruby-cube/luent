import { UIDGenerator } from "@rue/utils";
import { onUnmount } from "../flask/flask-hooks";

const genUID = UIDGenerator(11)

//TODO: dynamic styling?
export function Style(strings: TemplateStringsArray, ...values: string[]) {
   const cssText = composeCSSText(strings, values)
   const id = genUID()
   const style = insertStyle(cssText, id)
   onUnmount(() => {
      style.remove();
   })
}

function insertStyle(cssText: string, id: string) {
   const style = document.createElement('style');
   if (id) style.id = id;
   document.head.appendChild(style);
   style.textContent = cssText;
   return style;
}

function composeCSSText(strings: TemplateStringsArray, values: string[]) {
   return strings.reduce((cssText, string, i) => cssText + string + (i < values.length ? values[i] : ''), '')
}

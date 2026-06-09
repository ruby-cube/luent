import { UIDGenerator } from "@rue/utils";
import { beforeUninstall, beforeUnmount } from "../flask/flask-hooks";
import { isTransitioningOut } from "../transitions/transitions";
import { getFlask } from "@rue/flask";
import { queueTask } from "@rue/quarky";

const genUID = UIDGenerator(11)


// TODO: dynamic styling?
function declareStyles(strings: TemplateStringsArray, ...values: any[]): string {
   return composeCSSText(strings, values)
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

export const css = declareStyles
export const style = declareStyles

export function Style(cssText: string) {
   const id = genUID()
   const style = insertStyle(cssText, id)
   const flask = getFlask()
   beforeUninstall(() => {
      if (isTransitioningOut(flask)) {
         queueTask(() => {
            flask.onDiscard(() => {
               style.remove()
            })
         })
         return;
      }
      style.remove(); // TODO: wait till end of transition to remove
   })
}
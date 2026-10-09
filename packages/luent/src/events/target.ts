import { isFunction } from "@luently/utils";
import { NodeRef } from "../node/NodeRef";

export function matchEventTarget(this: Event, ...args: [...(string | ((x: HTMLElement) => boolean) | NodeRef)[]]) {
   // if (!e || !('target' in e)) throw new Error('JSX transform failed to add event object to e.() call')
   const targ = this.target
   for (const arg of args) {
      if (typeof arg === 'string') {
         if (matchSelector(targ as HTMLElement, arg)){
           return true;
         }
      }
      // else if (isNodeRef(arg)){ // TODO:

      // }
      else if (isFunction(arg) && arg(targ as HTMLElement)) {
         return true;
      }
   }
   return false;
}

function matchSelector(target: EventTarget & HTMLElement, selector: string): boolean {
  if (selector.startsWith('.')) {
     return target.classList.contains(selector.slice(1))
    }
    else if (selector.startsWith('#')) {
      return target.id === selector.slice(1);
    }
    else if (selector.startsWith('style.')) {
      // style: pattern 'style.propertyCamel:value'
      const [key, value] = selector.slice(6).split(':')
      //@ts-expect-error
      return target.style[key] === value; // TODO: key toCamelCase
    }
    else if (selector.startsWith('x-')) {
      // data-attribute
      // return target.dataset[toCamelCase(selector.slice(2))] === 'true'; // TODO: toCamelCase
    }
    else {
     return target.tagName.toLowerCase() === selector;
    }
   return false;
}
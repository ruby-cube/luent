import { NodeRef } from "../node/NodeRef";

export function target(...args: [...(string | ((x: HTMLElement) => boolean) | NodeRef)[]]) {
   const e = args.at(-1) as object
   if (!e || !('target' in e)) throw new Error('JSX transform failed to add event object to target() call')
   const targ = e.target
   for (const arg of args) {
      if (typeof arg === 'string') {
         if (matchSelector(targ as HTMLElement, arg))
            return true;
      }
      // else if (isNodeRef(arg)){ //TODO:

      // }
      else if (arg instanceof Function && arg(targ as HTMLElement)) {
         return true;
      }
   }
   return false;
}

function matchSelector(target: EventTarget & HTMLElement, selector: string): boolean {
   if (selector.startsWith('.')) {
      return target.classList.contains(selector)
   }
   else if (selector.startsWith('#')) {
      return target.id === selector;
   }
   else if (selector.startsWith('style.')) {
      // style: pattern 'style.propertyCamel:value'
      const [key, value] = selector.slice(6).split(':')
      //@ts-expect-error
      return target.style[key] === value; //TODO: key toCamelCase
   }
   else if (selector.startsWith('x-')) {
      // data-attribute
      // return target.dataset[toCamelCase(selector.slice(2))] === 'true'; //TODO: toCamelCase
   }
   else {
      return target.tagName === selector;
   }
   return false;
}
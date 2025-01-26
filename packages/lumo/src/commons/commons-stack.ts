import { ContextualState } from "../../../flask/context/AsyncContext";
import { NodeCommons } from "./Commons";
import { AppCommons } from "./provide";

export type Commons = NodeCommons | AppCommons

// manage commons stack
// let currentContext: Commons | undefined;
// let previousContext: Commons | undefined;

// export function getCurrentContext() {
//    return currentContext;
// }

// NOTE: 
// Async render functions (e.g. for conditionals or iteratives) 
// must be wrapped with its commons with push and pop for when they run asynchronously
// However, it must NOT push and pop commons for its initial render.

export function pushCommons(commons: Commons | undefined) {
   if (!commons) throw new Error(`Provider is undefined`)
   // previousContext = currentContext;
   // currentContext = commons;
   commonsStack.push(commons)
}

export function popCommons() {
   commonsStack.pop()
   // currentContext = previousContext;
   // previousContext = previousContext?.parent
}

export function getCommons() {
   const commons = getClosestCommons()
   if (!commons) throw new Error('No commons found')
   return commons;
}

export const [getClosestCommons, setCommons, commonsStack] = ContextualState<Commons>('commons')






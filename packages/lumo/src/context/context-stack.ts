import { createStack } from "../../../flask/context/AsyncContext";
import { NodeContext } from "./Commons";
import { AppContext } from "./provide";

export type Context = NodeContext | AppContext

// manage commons stack
// let currentContext: Context | undefined;
// let previousContext: Context | undefined;

// export function getCurrentContext() {
//    return currentContext;
// }

// NOTE: 
// Async render functions (e.g. for conditionals or iteratives) 
// must be wrapped with its commons with push and pop for when they run asynchronously
// However, it must NOT push and pop commons for its initial render.

export function pushCommons(commons: Context | undefined) {
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
   const commons = getActiveCommons()
   if (!commons) throw new Error('No commons found')
   return commons;
}

const commonsStack = createStack<Context>({
   name: 'commons',
   getParent(node) {
      return node?.parent
   }
})

export function getActiveCommons() {
   return commonsStack.getActiveNode();
}




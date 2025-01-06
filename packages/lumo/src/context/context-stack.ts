import { NodeContext } from "./Context";
import { AppContext } from "./provide";

export type Context = NodeContext | AppContext

// manage context stack
let currentContext: Context | undefined;
let previousContext: Context | undefined;

export function getCurrentContext() {
   return currentContext;
}

// NOTE: 
// Async render functions (e.g. for conditionals or iteratives) 
// must be wrapped with its context with push and pop for when they run asynchronously
// However, it must NOT push and pop context for its initial render.

export function pushContext(context: Context | undefined) {
   console.trace('push context', context)
   if (!context) throw new Error(`Provider is undefined`)
   previousContext = currentContext;
   currentContext = context;
}

export function popContext() {
   console.trace('pop context', currentContext, previousContext)
   currentContext = previousContext;
   previousContext = previousContext?.parent
}

export function getContext() {
   const context = getCurrentContext()
   if (!context) throw new Error('No context found')
   return context;
}
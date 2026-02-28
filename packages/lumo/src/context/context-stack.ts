import { AsyncState } from "../../../flask/context/AsyncContext";
import { NodeContext, RootContext } from "./Context";

export type ContextNode = NodeContext | RootContext

// manage context stack
// let currentContext: Context | undefined;
// let previousContext: Context | undefined;

// export function getCurrentContext() {
//    return currentContext;
// }

// NOTE: 
// Async render functions (e.g. for conditionals or iteratives) 
// must be wrapped with its context with push and pop for when they run asynchronously
// However, it must NOT push and pop context for its initial render.

export function pushContext(context: ContextNode | undefined) {
   if (!context) throw new Error(`Provider is undefined`)
   // previousContext = currentContext;
   // currentContext = context;
   contextStack.push(context)
}

export function popContext() {
   contextStack.pop()
   // currentContext = previousContext;
   // previousContext = previousContext?.parent
}

export function getContext() {
   const context = getClosestContext()
   if (!context) throw new Error('No context found')
   return context;
}

export const CONTEXT = 'context'

export const [getClosestContext, contextStack] = AsyncState<ContextNode>(CONTEXT)






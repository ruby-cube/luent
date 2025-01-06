import { NodeContext } from "./Context";
import { AppContext } from "./provide";

export type Context = NodeContext | AppContext

// manage context stack
let currentContext: Context | undefined;
let previousContext: Context | undefined;

export function getCurrentContext() {
   return currentContext;
}

// export function pushAppContext(context: Context) {
//    currentContext = context;
//    previousContext = context;
// }

// export function popAppContext() {
//    currentContext = undefined;
//    previousContext = undefined;
// }

export function pushContext(context: Context | undefined) {
   console.trace('push context', context)
   if (!context) throw new Error(`Provider is undefined`)
   // previousContext = currentContext || context.app; // TODO: I worry that this leaves the app context active when it shouldn't..
   previousContext = currentContext;
   currentContext = context;
}

export function popContext() {
   console.trace('pop context', currentContext, previousContext)
   currentContext = previousContext;
   previousContext = previousContext?.parent
   // previousContext = previousContext?.parent || previousContext?.app // TODO: I worry that this leaves the app context active when it shouldn't..
}
//TODO: I think because all slots are rendered asynchronously, maybe all slots need to be wrapped with their parent's context...

export function getContext() {
   const context = getCurrentContext()
   if (!context) throw new Error('No context found')
   return context;
}
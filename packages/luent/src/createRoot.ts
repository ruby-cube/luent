import { ComponentTag } from "./component/Component";
import { AnyObject } from "@rue/types";
import { RootContext, createRootContext } from "./context/provide";
import { popContext, pushContext } from "./context/context-stack";
import { Flask, flaskStack } from "@rue/flask";
import { instantUpdate, load, atRender } from "@rue/quarky";
import { Provided } from "./context/Context";
import { JSXNode, mountDOMNodes, processJSXOutput, removeDOMNodes, setUpNodeVine } from "./node/VineNode";
import { RenderFunction } from "./node/makeJSXNode";

let appRoot: Element;

export function getAppRoot() {
   return appRoot;
}

// The mount function simulates this:
//
// function RootComponent(){
//     return (
//         <div id="app">
//             < App />
//         </div>
//     )
// }


export function createRoot<T extends AnyObject, E extends Provided>(App: ComponentTag<T> | RenderFunction, config?: { provide?: E, remountable?: boolean, groundContext?: RootContext, setup?: T }) {

   // (1) instantiate developer's root component
   const rootContext = createRootContext(config?.provide, config?.groundContext)
   // console.trace('rootContext', rootContext, config)
   const remountable = config?.remountable
   const flask = new Flask({ type: 'view' });

   return {
      nodes: undefined as JSXNode[] | undefined,
      mount(element: string | HTMLElement | SVGAElement) {
         const root = typeof element === 'string' ? document.querySelector(element) : element;
         if (!(root instanceof Element)) throw new Error('No root element to mount app to. Check selector string')
         appRoot = root!;

         // let component: Component = { exposed: undefined, jsxNodes: [] }
         // (2) attach developer's root component to root element
         // flask.containCall(function mountRootComponent() {

         load(() => { // FIX: Error are being swallowed up here despite being rethrown
            flaskStack.push(flask)
            pushContext(rootContext)
            let nodes: JSXNode[]
            try {
               nodes = this.nodes = processJSXOutput(App())
               setUpNodeVine(nodes, appRoot)
               atRender(() => {
                  mountDOMNodes(nodes, appRoot)
               })

               flask.emitInitialMount()
            }
            finally {
               flaskStack.pop()
               // if (remountable) markMountPhase()
               // component.setUp(root, nodePod)
               // component.mount(root) // TODO: if this is a remount, how would it be different than a first mount? use fragment?
               // if (remountable) unmarkMountPhase()
               popContext() // for sibling components to access parent, must be set AFTER `component()`
            }
         })


      },

      unmount() { // TODO: should I call dynamicNode.unmount() instead of emit?? same for discard?
         if (!remountable) {
            if ( __DEV__) throw new Error('App cannot be unmounted. Did you mean to call `discard`? To enable unmount and remount, set `remountable` to true in config.')
            return;
         }
         if (this.nodes) removeDOMNodes(this.nodes);
      },

      discard() {
         this.unmount()
         flask.emitDiscard()
      }
   }
}



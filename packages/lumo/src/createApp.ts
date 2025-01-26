import { Component, ComponentSetup, DOMNode, InternalComponent } from "./component/InternalComponent";
import { AnyObject } from "@rue/types";
import { setComponentAttributes } from "./component/makeComponent";
import { AppCommons, createAppContext } from "./commons/provide";
import { getCommons, popCommons, pushCommons } from "./commons/commons-stack";
import { ContextEntries } from "./commons/Commons";
import { _dog_ } from "./commons/x_context-keys";
import { NodePod } from "./node/NodePod";
import { removeDOMNodes } from "./conditional/ConditionalRenderSeries";
import { Flask } from "@rue/flask";

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


export function createApp<T extends AnyObject, E extends ContextEntries<E>>(App: ComponentSetup<T>, config?: { with?: E, remountable?: boolean, globalContext?: AppCommons, setup?: T }) {

   // (1) instantiate developer's root component
   const appContext = createAppContext(config?.with, config?.globalContext)
   const nodePod = new NodePod()
   const remountable = config?.remountable
   const flask = new Flask({ type: 'view' });

   return {
      mount(element: string | HTMLElement | SVGAElement) {
         const root = typeof element === 'string' ? document.querySelector(element) : element;
         if (!(root instanceof Element)) throw new Error('No root element to mount app to. Check selector string')
         appRoot = root!;

         // (2) attach developer's root component to root element
         flask.contain(function mountRootComponent() {
            let output: Component = { renderedTemplate: undefined }
            pushCommons(appContext)
            // runProviderComponentSetup(App, component, undefined, {}, undefined); //TODO: preserve node entities for remount
            setComponentAttributes(config?.setup || {})
            try {
               output = App()
            }
            catch (err) {
               console.error('uhoh', err)
            }
            finally {
               setComponentAttributes(undefined)
               const component = new InternalComponent(output, undefined, undefined); //TODO: allow ref for root component?
               // if (remountable) markMountPhase()
               component.setUp(root, nodePod)
               component.mount(root) //TODO: if this is a remount, how would it be different than a first mount? use fragment?
               // if (remountable) unmarkMountPhase()
               popCommons() // for sibling components to access parent, must be set AFTER `component()`
            }
         })

         // return component;
      },

      unmount() { //TODO: should I call dynamicNode.unmount() instead of emit?? same for discard?
         if (!remountable) {
            if (__DEV__) throw new Error('App cannot be unmounted. Did you mean to call `discard`? To enable unmount and remount, set `remountable` to true in config.')
            return;
         }
         removeDOMNodes(nodePod);
      },

      discard() {
         this.unmount()
         flask.discard()
      }
   }
}



import { Component, ComponentSetup } from "./component/Component";
import { AnyObject } from "@rue/types";
import { AppCommons, createAppCommons } from "./commons/provide";
import { getCommons, popCommons, pushCommons } from "./commons/commons-stack";
import { NodePod, removeDOMNodes } from "./node/NodePod";
import { Flask } from "@rue/flask";
import { MU, muIonsStack } from "./component/Input";
import { createUpdate, Ion, pushUpdate, popUpdate } from "@rue/quarky";
import { Provided } from "./commons/Commons";
import { processJSXOutput } from "./node/setUpNodeEntities";
import { mountNodeEntities } from "./node/mountNodeKits";
import { toInput } from "./component/fromTag";

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


export function createApp<T extends AnyObject, E extends Provided>(App: ComponentSetup<T>, config?: { provide?: E, remountable?: boolean, globalCommons?: AppCommons, setup?: T }) {

   // (1) instantiate developer's root component
   const appCommons = createAppCommons(config?.provide, config?.globalCommons)
   const nodePod = new NodePod()
   const remountable = config?.remountable
   const flask = new Flask({ type: 'view' });

   return {
      mount(element: string | HTMLElement | SVGAElement) {
         const root = typeof element === 'string' ? document.querySelector(element) : element;
         if (!(root instanceof Element)) throw new Error('No root element to mount app to. Check selector string')
         appRoot = root!;

         let component: Component = { exposed: undefined, jsxNodes: [] }
         // (2) attach developer's root component to root element
         flask.containCall(function mountRootComponent() {
            const muIons: Set<Ion> = new Set()
            const attributes = {
               ...config?.setup || {},
               [MU](ion: Ion) {
                  return muIons?.has(ion)
               }
            }
            const update = createUpdate(1000)
            pushUpdate(update)
            // setComponentAttributes(attributes)
            muIonsStack.push(muIons)
            pushCommons(appCommons)
            // runProviderComponentSetup(App, component, undefined, {}, undefined); //TODO: preserve node entities for remount
            // setComponentAttributes(config?.setup || {})
            try {
               mountNodeEntities(processJSXOutput(App(toInput(attributes)), appRoot, nodePod), appRoot)
            }
            finally {
               flask.emitInitialMount()
               // setComponentAttributes(undefined)
               muIonsStack.pop()
               popUpdate()
               // if (remountable) markMountPhase()
               // component.setUp(root, nodePod)
               // component.mount(root) //TODO: if this is a remount, how would it be different than a first mount? use fragment?
               // if (remountable) unmarkMountPhase()
               popCommons() // for sibling components to access parent, must be set AFTER `component()`
            }
         })

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
         flask.emitDiscard()
      }
   }
}



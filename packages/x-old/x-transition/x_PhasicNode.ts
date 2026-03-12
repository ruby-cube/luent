import { Context as createContext } from "../../lumo/src/context/Context";
import { makeElement } from "../../lumo/src/element/makeElement";
import { TransitionFunction, TransitionKit, TransitionDef, TransitionClasses } from "./defineTransition";
import { fromContext } from "../../lumo/src/context/provide";
import { AnimationFunction, AnimationKit } from "./defineAnimation";
import { NodeRef, NodeRef } from "../../lumo/src/node/NodeRef";
import { TransitionNode } from "./TransitionNode";
import type { Context } from "../../lumo/src/context/context-stack";
import { Ion } from "@rue/quarky";
import { template } from "../../lumo/src/component/Component";
import { createIfSeries, Else, If } from "../../lumo/src/conditional/If";
import { ContextKey } from "../../lumo/src/context/ContextKey";
import { RenderSlot } from "../../lumo/src/component/Input";

export type TransitionConfig = TransitionFunction | AnimationFunction | TransitionKit | AnimationKit



// export const GET_PHASIC_NODE = Symbol('usePhaseChange')


const GET_PHASIC_NODE = ContextKey<() => TransitionNode | null>('GET_PHASIC_NODE')

// declare module '@rue/lumo' {
//     interface ContextKeyMap {
//         [GET_PHASIC_NODE]: typeof getPhasicNodeDef
//     }
// }



export type PhasicNode = {
   phaseIn(endTransition: () => void): void;
   phaseOut(endTransition: (cb: () => void) => void): void;
   cancel(direction: "in" | "out", transitionStartTime: number): void
}


export function renderPhasicNode(
   $div: NodeRef<'div'>,
   Slot: RenderSlot,
   transitionNode: TransitionNode,
   $disable: false | undefined | Ion<boolean>
) {
   if ($disable) {
      const output = Slot()
      return template(createIfSeries([
         If($disable, () =>
            output
         ),
         Else(() => {
            return createPhasicNode(
               $div,
               () => output,
               transitionNode
            )
         })
      ]))
   }
   return createPhasicNode(
      $div,
      Slot,
      transitionNode
   )
}

function createPhasicNode(
   $div: NodeRef<'div'>,
   Slot: RenderSlot,
   transitionNode: TransitionNode,
) {
   let phasicNode: null | TransitionNode = transitionNode

   function _getPhasicNode() {
      const _phaseNode = phasicNode
      phasicNode = null;
      return _phaseNode
   }

   return createContext({
      Slot: () => (
         makeElement('div', Slot, { get: $div, class: 'phasic' }, undefined)
      ),
      provide: [GET_PHASIC_NODE(_getPhasicNode)]
   })
}

export function getPhasicNode(context?: Context) {
   const phasicNode = fromContext(GET_PHASIC_NODE, '?', context)?.()
   return phasicNode
}









import { Context as createContext } from "../../luent/src/context/Context";
import { makeElement } from "../../luent/src/element/makeElement";
import { TransitionFunction, TransitionKit, TransitionDef, TransitionClasses } from "./defineTransition";
import { fromContext } from "../../luent/src/context/provide";
import { AnimationFunction, AnimationKit } from "./defineAnimation";
import { NodeRef, NodeRef } from "../../luent/src/node/NodeRef";
import { TransitionNode } from "./TransitionNode";
import type { Context } from "../../luent/src/context/context-stack";
import { Ion } from "@rue/quarky";
import { template } from "../../luent/src/component/Component";
import { createIfSeries, Else, If } from "../../luent/src/conditional/If";
import { ContextKey } from "../../luent/src/context/ContextKey";
import { RenderSlot } from "../../luent/src/component/x-Input";

export type TransitionConfig = TransitionFunction | AnimationFunction | TransitionKit | AnimationKit



// export const GET_PHASIC_NODE = Symbol('usePhaseChange')


const GET_PHASIC_NODE = ContextKey<() => TransitionNode | null>('GET_PHASIC_NODE')

// declare module '@rue/luent' {
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
      return Component(createIfSeries([
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









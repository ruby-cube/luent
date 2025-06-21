import { Commons as createCommons } from "../commons/Commons";
import { makeElement } from "../element/makeElement";
import { JSXNode } from "../node/makeNode";
import { TransitionFunction, TransitionKit, TransitionDef, TransitionClasses } from "./defineTransition";
import { fromCommons } from "../commons/provide";
import { AnimationFunction, AnimationKit } from "./defineAnimation";
import { NodeRef } from "../node/NodeRef";
import { TransitionNode } from "./TransitionNode";
import type { Commons } from "../commons/commons-stack";
import { Ion } from "@rue/quarky";
import { component, Slot } from "../component/Component";
import { Else, If } from "../conditional/If";
import { isFunction } from "@rue/utils";
import { CommonsKey } from "../commons/CommonsKey";

export type TransitionConfig = TransitionFunction | AnimationFunction | TransitionKit | AnimationKit



// export const GET_PHASIC_NODE = Symbol('usePhaseChange')


const GET_PHASIC_NODE = CommonsKey<()=>TransitionNode|null>('GET_PHASIC_NODE')

// declare module '@rue/lumo' {
//     interface CommonsKeyMap {
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
   Slot: () => JSXNode,
   transitionNode: TransitionNode,
   $disable: false | undefined | Ion<boolean>
) {
   if ($disable) {
      const output = isFunction(Slot) ? Slot() : Slot
      return component([
         If($disable, () =>
            output
         ),
         Else(() => {
            return createPhasicNode(
               $div,
               output,
               transitionNode
            )
         })
      ])
   }
   return createPhasicNode(
      $div,
      Slot,
      transitionNode
   )
}

function createPhasicNode(
   $div: NodeRef<'div'>,
   Slot: Slot,
   transitionNode: TransitionNode,
) {
   let phasicNode: null | TransitionNode = transitionNode

   function _getPhasicNode() {
      const _phaseNode = phasicNode
      phasicNode = null;
      return _phaseNode
   }

   return createCommons({
      Slot: () => (
         makeElement('div', Slot, { ref: $div, class: 'phasic' }, undefined)
      ),
      provide: [GET_PHASIC_NODE(_getPhasicNode)]
   })
}

export function getPhasicNode(commons?: Commons) {
   const phasicNode = fromCommons(GET_PHASIC_NODE, '?', commons)?.()
   return phasicNode
}









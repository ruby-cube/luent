import { TransitionNode } from "./TransitionNode";
import { NodeRef } from "../../luent/src/node/NodeRef";
import { makeElement } from "../../luent/src/element/makeElement";
import { fromContext } from "../../luent/src/context/provide";
import { Ion } from "@rue/quarky";
import { template } from "../../luent/src/component/Component";
import { createIfSeries, Else, If } from "../../luent/src/conditional/If";
import { isFunction } from "@rue/utils";
import { ContextKey } from "../../luent/src/context/ContextKey";
import { RenderSlot } from "../../luent/src/component/Input";

export function renderTransitNode(
   $div: NodeRef<'div'>,
   Slot: RenderSlot,
   transitionNode: TransitionNode,
   $disable: false | undefined | Ion<boolean>
) {
   if ($disable) {
      const output = isFunction(Slot) ? Slot() : Slot //QUESTION: is it necessary to call Slot here? Can we call it within conditional blocks?
      return template(
         createIfSeries([
            If($disable, () =>
               output
            ),
            Else(() => {
               registerTransitionNode(transitionNode)
               return makeElement('div', () => output, { get: $div }, undefined)
            })
         ])
      )
   }
   registerTransitionNode(transitionNode)
   return makeElement('div', Slot, { get: $div, class: 'transit' }, undefined)
}



// export function animateTransition(div: HTMLDivElement, className: string, endTransition: (cb: () => void) => void) {
//     div.classList.add(className);

//     div.addEventListener(
//         "animationend",
//         () => {
//             endTransition(() => {
//                 div.classList.remove(className);
//             })
//         },
//         { once: true }
//     );
// }



// const REGISTER_TRANSITION_NODE = Symbol('registerTransitionNode')

// function REGISTER_TRANSITION_NODE(v: (transitionNode: TransitionNode) => void) {
//    return [REGISTER_TRANSITION_NODE, v] 
// }

const REGISTER_TRANSITION_NODE = ContextKey<(transitionNode: TransitionNode) => void>('REGISTER_TRANSITION_NODE')

// declare module '@rue/luent' {
//     interface ContextKeyMap {
//         [REGISTER_TRANSITION_NODE]: typeof pushTransitionNode
//     }
// }

function registerTransitionNode(transitionNode: TransitionNode) {
   fromContext(REGISTER_TRANSITION_NODE)(transitionNode)
}

export function useTransitionNodes() {
   const transitionNodes: TransitionNode[] = [];
   return {
      REGISTER_TRANSITION_NODE,
      transitionNodes,
      registerTransitionNode(transitionNode: TransitionNode) {
         transitionNodes.push(transitionNode);
      }
   }
}



export function computeTransitionalState(duration: number, elapsedTime: number, initialState: number, finalState: number, easing: string) {
   // TODO: incorporate easing into computation
   const percentage = elapsedTime / duration;
   return (finalState - initialState) * percentage + initialState;
}


//TRANSITION OUT CASES:
// with phasicNode
// - io ends before phasic node: should pause state until transition cleanup
// - io ends after phasic node: let phasic node cancel io node transition... io node must pass its cleanup to phaic node to cleanup for them
//
//without phasicNode
// - io's end at different times: don't cleanup until the last io finishes
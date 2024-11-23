import {  createNodeContext } from "../context/Context";
import { defineContextProp } from "../context/ContextKey";
import { makeElement } from "../element/makeElement";
import { NodeEntity } from "../node/makeNode";
import { TransitionFunction, TransitionKit, TransitionDef, TransitionClasses } from "./defineTransition";
import { contextual } from "../context/provide";
import { AnimationFunction, AnimationKit } from "./defineAnimation";
import { NodeRef } from "../node/NodeRef";
import { TransitionHook, TransitionNode } from "./TransitionNode";
import type { Context as ContextType } from "../context/context-stack";
import { v } from "../InputTypes";

export type TransitionConfig = TransitionFunction | AnimationFunction | TransitionKit | AnimationKit



export const GET_PHASIC_NODE = Symbol('usePhaseChange')

const getPhasicNodeDef = defineContextProp(GET_PHASIC_NODE, v<() => TransitionNode>('?'))

declare module '@rue/lumo' {
    interface ContextKeyMap {
        [GET_PHASIC_NODE]: typeof getPhasicNodeDef
    }
}



export type PhasicNode = {
    phaseIn(endTransition: () => void): void;
    phaseOut(endTransition: (cb: () => void) => void): void;
    cancel(direction: "in" | "out", transitionStartTime: number): void
}


export function renderPhaseChangeNode(
    $div: NodeRef<'div'>,
    Slot: [string] | (() => NodeEntity | NodeEntity[]),
    transitionNode: TransitionNode
) {

    // let controller = new AbortController()

    let phasicNode: null | TransitionNode = transitionNode

    //     phaseIn(endTransition: () => void) {
    //         const div = $div()!
    //         if (onStart) onStart({ phase: 'in' })

    //         let endTransitionCount = 0;

    //         if (transition_in) {
    //             requestAnimationFrame(() => {
    //                 div.classList.remove(...enterFromClasses!);

    //                 endTransitionCount++;
    //                 div.addEventListener(
    //                     "transitionend",
    //                     () => {
    //                         div.classList.remove(transition_in);
    //                         endTransitionCount--;
    //                         if (endTransitionCount === 0) {
    //                             if (onEnd) onEnd({ phase: 'in' })
    //                             endTransition() //transitioning = false 
    //                         }
    //                     },
    //                     { once: true, signal: controller.signal }
    //                 );
    //             })
    //         }
    //         if (animate_in) {
    //             endTransitionCount++
    //             animateTransition(div, animate_in, () => {
    //                 endTransitionCount--;
    //                 if (endTransitionCount === 0) {
    //                     if (onEnd) onEnd({ phase: 'in' })
    //                     endTransition() //transitioning = false 
    //                 }
    //             })
    //         }
    //     },

    //     phaseOut(endTransition: (cb?: () => void) => void) {
    //         const div = $div()!
    //         if (onStart) onStart({ phase: 'out' })
    //         if (transition_out) {
    //             requestAnimationFrame(() => {
    //                 div.classList.add(transition_out);
    //                 div.classList.add(...exitClasses!);

    //                 div.addEventListener(
    //                     "transitionend",
    //                     () => {
    //                         endTransitionOut(div)
    //                         endTransition(()=>{

    //                         }) // transitioning = false; unmountNodes()
    //                     },
    //                     { once: true, signal: controller.signal }
    //                 );
    //             })
    //         }
    //         if (animate_out) {
    //             animateTransition(div, animate_out, endTransition)
    //         }
    //     },

    //     cancel(direction: 'in' | 'out', transitionStartTime: number) {
    //         const div = $div()!
    //         controller.abort()
    //         //TODO: abort requestAnimationFrame?

    //         if (direction === 'in'){
    //             if (transition_in) {
    //                 div.classList.remove(transition_in);
    //             }


    //             for (const key in transitionInProperties) {
    //                 //TODO: requires A LOT more information to compute transitional state...
    //                 const transitionalState = computeTransitionalState(transitionIn.duration, new Date().getTime() - transitionStartTime, 0, -100, '')

    //                 div.style.setProperty('transform', `translateX(${transitionalState}px)`);
    //             }
    //         }
    //         else {
    //             if (transition_out) {
    //                 endTransitionOut(div)
    //             }
    //         }
    //     }
    // }

    // function endTransitionOut(div: HTMLDivElement) {
    //     div.classList.remove(...exitClasses!);
    //     div.classList.remove(transition_out!);

    //     if (transition_in) {
    //         div.classList.add(...enterFromClasses!);
    //         div.classList.add(transition_in);
    //     }
    // }

    function _getPhasicNode() {
        const _phaseNode = phasicNode
        phasicNode = null;
        return _phaseNode
    }


    return createNodeContext(() => (
        makeElement('div', Slot, { ref: $div }, undefined)
    ), { with: { [GET_PHASIC_NODE]: _getPhasicNode } })
}

export function getPhasicNode(context?: ContextType) {
    return contextual(GET_PHASIC_NODE)?.()
}









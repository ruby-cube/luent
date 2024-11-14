import { Context, createNodeContext } from "../context/Context";
import { defineContextProp } from "../context/ContextKey";
import { makeElement } from "../element/makeElement";
import { $Ion, Ion, v } from "../InputTypes";
import { NodeEntity } from "../node/makeNode";
import { TransitionFunction, TransitionKit, TransitionDef, TransitionClasses } from "./defineTransition";
import { contextual } from "../context/provide";
import { AnimationFunction, AnimationKit } from "./defineAnimation";
import { NodeRef } from "../node/NodeRef";
import { animateTransition } from "./I-O";
import { TransitionHook } from "./TransitionNode";

export type TransitionConfig = TransitionFunction | AnimationFunction | TransitionKit | TransitionClasses | AnimationKit | AnimationClass

type AnimationClass = string;

export const GET_PHASIC_NODE = Symbol('usePhaseChange')

const getPhasicNodeDef = defineContextProp(GET_PHASIC_NODE, v<() => PhasicNode>('?'))

declare module '@rue/lumo' {
    interface ContextKeyMap {
        [GET_PHASIC_NODE]: typeof getPhasicNodeDef
    }
}



export type PhasicNode = {
    phaseIn(endTransition: () => void): void;
    phaseOut(endTransition: () => void): void;
}


export function renderPhaseChangeNode(
    $div: NodeRef<'div'>,
    Slot: [string] | (() => NodeEntity | NodeEntity[]),
    transition_in: undefined | string,
    enterClasses: undefined | string[],
    transition_out: undefined | string,
    exitClasses: undefined | string[],
    animate_in: undefined | string,
    animate_out: undefined | string,
    onStart: undefined | ((hook: TransitionHook) => void),
    onEnd: undefined | ((hook: TransitionHook) => void)
) {
    let phaseChange: null | PhasicNode = {

        phaseIn(endTransition: () => void) {
            const div = $div()!
            if (onStart) onStart({ phase: 'in' })

            let endTransitionCount = 0;

            if (transition_in) {
                div.classList.remove(...enterClasses!);

                endTransitionCount++;
                div.addEventListener(
                    "transitionend",
                    () => {
                        if (transition_in) div.classList.remove(transition_in);
                        endTransitionCount--;
                        if (endTransitionCount === 0) {
                            if (onEnd) onEnd({ phase: 'in' })
                            endTransition() //transitioning = false 
                        }
                    },
                    { once: true }
                );
            }
            if (animate_in) {
                endTransitionCount++
                animateTransition(div, animate_in, () => {
                    endTransitionCount--;
                    if (endTransitionCount === 0) {
                        if (onEnd) onEnd({ phase: 'in' })
                        endTransition() //transitioning = false 
                    }
                })
            }
        },

        phaseOut(endTransition: () => void) {
            const div = $div()!
            if (onStart) onStart({ phase: 'out' })
            if (transition_out) {
                div.classList.add(transition_out);
                div.classList.add(...exitClasses!);

                div.addEventListener(
                    "transitionend",
                    () => {
                        div.classList.remove(...exitClasses!);
                        div.classList.remove(transition_out);

                        if (transition_in) {
                            div.classList.add(...enterClasses!);
                            div.classList.add(transition_in);
                        }

                        endTransition() // transitioning = false; unmountNodes()
                    },
                    { once: true }
                );
            }
            if (animate_out) {
                animateTransition(div, animate_out, endTransition)
            }
        }
    }

    function getPhasicNode() {
        const _phaseChange = phaseChange
        phaseChange = null;
        return _phaseChange
    }


    return createNodeContext(Context, () => (
        makeElement('div', Slot, {}, undefined)
    ), { with: { [GET_PHASIC_NODE]: getPhasicNode } })
}

export function getPhasicNode() {
    return contextual(GET_PHASIC_NODE)?.()
}









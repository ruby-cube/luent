import { Component } from "../component/InternalComponent";
import { Context, createNodeContext } from "../context/Context";
import { makeElement } from "../element/makeElement";
import { NodeEntity } from "../node/makeNode";
import { TransitionFunction, TransitionKit, TransitionVars } from "./defineTransition";

export type TransitionConfig = TransitionFunction | TransitionKit

type TransitionHook = {
    phase: 'in' | 'out'
}

export const OFFSCREEN_CLASSNAME = Symbol('offscreen_classname')
export const SHOULD_TRANSITION_IN_AND_OUT = Symbol('offscreen_classname')

//TODO: transition on load?
export function Transition(input: {
    load?: TransitionConfig | TransitionConfig[];
    in?: TransitionConfig | TransitionConfig[],
    out?: TransitionConfig | TransitionConfig[],
    both?: TransitionConfig | TransitionConfig[],
    onStart?: (task: (hook: TransitionHook) => void) => void; //TODO:
    onEnd?: (task: (hook: TransitionHook) => void) => void;
    renderSlot: (() => NodeEntity | NodeEntity[]) | NodeEntity | NodeEntity[]
}) {
    const { renderSlot, onStart, onEnd } = input
    if (!(renderSlot instanceof Function)) throw new Error('')

    //TODO: compile arrays
    const transition = input.both
    const transitionIn = input.in
    const transitionOut = input.out

    const offscreenClass = transition.offscreenClass

    const renderedTemplate = renderSlot();

    return Component(
        createNodeContext(Context, () => (
            makeElement('div', renderedTemplate, {
                class: `style-container ${offscreenClass}`, style: transition ? {
                    '--transition-delay': transition.delay + 'ms',
                    '--transition-duration': transition.duration + 'ms',
                    '--transition-timing': transition.timing
                } : undefined
            }, undefined)
        ), { with: { [OFFSCREEN_CLASSNAME]: offscreenClass, [TRANSITION_IN_OUT]: true } })

    )
}


// .style-container {
//   display: inline
//}


function generateTransitionStyles(config: TransitionConfig | TransitionConfig[]) {
    if (config instanceof Array) {
        for (const entity of config) {

        }
        return {

        }
    }
    const vars = config instanceof Function ? config() : config;
    return {
        '--transition-duration': vars.duration,
        '--transition-timing': vars.timing,
    }
}

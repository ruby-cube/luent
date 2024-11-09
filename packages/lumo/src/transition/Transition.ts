import { Component } from "../component/InternalComponent";
import { makeElement } from "../element/makeElement";
import { NodeEntity } from "../node/makeNode";
import { TransitionFunction, TransitionVars } from "./defineTransition";

export type TransitionConfig = TransitionFunction | TransitionVars

type TransitionHook = {
    phase: 'in' | 'out'
}

export function Transition(input: {
    in?: TransitionConfig | TransitionConfig[],
    out?: TransitionConfig | TransitionConfig[],
    onStart?: (task: (hook: TransitionHook) => void) => void; //TODO:
    onEnd?: (task: (hook: TransitionHook) => void) => void;
    renderSlot: (() => NodeEntity | NodeEntity[]) | NodeEntity | NodeEntity[]
}) {
    const { renderSlot, onStart, onEnd } = input
    if (!(renderSlot instanceof Function)) throw new Error('')

    const same = input.in && input.out === '' || input.out && input.in === ''


    const transitionParams = same ? input.in ?? input.out : undefined;
    const transitionIn = same ? undefined : input.in ?? { delay: 0, duration: 250, timing: 'ease' }
    const transitionOut = same? undefined : input.out ?? { delay: 0, duration: 250, timing: 'ease' }


    const renderedTemplate = renderSlot();

    return Component(
        makeElement('div', renderedTemplate, { class: `style-container ${transitionClass}`, style: same ? {
            '--transition-delay': transitionParams?.
        } }, undefined)

    )
}


function generateTransitionStyles(config: TransitionConfig | TransitionConfig[]){
    if (config instanceof Array){
        for (const entity of config){

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

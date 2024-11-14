import { NodeEntity } from "../node/makeNode";
import { renderPhaseChangeNode, TransitionConfig } from "./PhaseChange";
import { TransitionFunction, TransitionKit } from "./defineTransition";
import { AnimationFunction, AnimationKit } from "./defineAnimation";
import { NodeRef } from "../node/NodeRef";
import { renderIONode } from "./I-O";

export type TransitionHook = {
    phase: 'in' | 'out'
}

export function createTransitionNode(
    type: 'phase-change' | 'i-o',
    Slot: [string] | (() => NodeEntity | NodeEntity[]),
    input: {
        'on-load'?: boolean;
        in?: TransitionConfig | TransitionConfig[];
        out?: TransitionConfig | TransitionConfig[];
        both?: TransitionConfig | TransitionConfig[];
        onStart?: (hook: TransitionHook) => void;
        onEnd?: (hook: TransitionHook) => void;
    }
) {
    const { in: inputIn, out: inputOut, both: inputBoth, "on-load": shouldTransitionLoad, onEnd, onStart } = input;
    const $div = NodeRef('div')

    const [transitionIn, animateIn] = normalizeToKitArrays(inputIn)
    const [transitionOut, animateOut] = normalizeToKitArrays(inputOut)
    const [transitionBoth, animateBoth] = normalizeToKitArrays(inputBoth)

    if (__DEV__ && transitionIn && transitionBoth || transitionOut && transitionBoth)
        console.warn(`The transition for 'both' will override transition for either 'in' or 'out'`)

    const enterClasses = compileOffscreenClasses(transitionBoth || transitionIn)
    const transition_in = mountTransitionClass(transitionBoth || transitionIn)
    const animate_in = mountAnimationClass(animateBoth || animateIn)
    const exitClasses = compileOffscreenClasses(transitionBoth || transitionOut)
    const transition_out = transitionBoth ? transition_in : mountTransitionClass(transitionOut)
    const animate_out = transitionBoth ? animate_in : mountAnimationClass(animateOut)

    //TODO: if no animation or transition provided, default to fade transition

    const renderNode = type === 'i-o' ? renderIONode : renderPhaseChangeNode

    return renderNode(
        $div,
        Slot,
        transition_in,
        enterClasses,
        transition_out,
        exitClasses,
        animate_in,
        animate_out,
        onStart,
        onEnd
    )
}



function normalizeToKitArrays(input: TransitionConfig | TransitionConfig[] | undefined): [(TransitionKit | TransitionFunction)[] | undefined, (AnimationKit | AnimationFunction)[] | undefined] {
    if (!input) return [undefined, undefined];
    if (input instanceof Function) {
        const transition = input();
        if ('animation' in transition) {
            return [undefined, [transition, <AnimationFunction>input]]
        }
        return [
            [transition, input],
            undefined
        ]
    }
    if (input instanceof Array) {
        const animationKits: (AnimationKit | AnimationFunction)[] = []
        const transitionKits: (TransitionKit | TransitionFunction)[] = []
        let defaultTransition: TransitionFunction | undefined;
        let defaultAnimation: AnimationFunction | undefined;
        for (const config of input) {
            const kit = config instanceof Function ? config() : config
            const isAnimationKit = 'animation' in kit;
            const kits = (isAnimationKit ? animationKits : transitionKits) as (AnimationKit | TransitionKit)[]
            kits.push(kit)
            if (kits.length === 2) {
                if (isAnimationKit && defaultAnimation) defaultAnimation = undefined;
                else if (defaultTransition) defaultTransition = undefined;
            }
            else if (kits.length === 1 && config instanceof Function) {
                if (isAnimationKit) defaultAnimation = <AnimationFunction>config;
                else defaultTransition = config;
            }
        }
        if (defaultTransition) {
            if (__DEV__ && transitionKits.length !== 1)
                throw new Error('This should never happen. Default transitions should only consist of one transition. For-loop logic is wrong')
            transitionKits.push(defaultTransition)
        }
        if (defaultAnimation) {
            if (__DEV__ && animationKits.length !== 1)
                throw new Error('This should never happen. Default transitions should only consist of one transition. For-loop logic is wrong')
            animationKits.push(defaultAnimation)
        }
        return [
            transitionKits.length === 0 ? undefined : transitionKits,
            animationKits.length === 0 ? undefined : animationKits
        ];
    }
    if ('animation' in input) {
        return [undefined, [input]]
    }
    return [[input], undefined]
}

function compileOffscreenClasses(transitions: (TransitionKit | TransitionFunction)[] | undefined) {
    if (!transitions) return undefined;
    const classes: string[] = []
    for (const transition of transitions) {
        if (transition instanceof Function) break;
        classes.push(transition.offscreenClass)
    }
    return classes;
}


//TODO: unmount when component unmounted
function mountTransitionClass(transitions: (TransitionKit | TransitionFunction)[] | undefined) {
    if (!transitions) return undefined;
    const maybeSetupFunction = transitions.at(-1);
    const shouldUseDefaultClass = maybeSetupFunction instanceof Function
    if (shouldUseDefaultClass && maybeSetupFunction.defaultClass) {
        return maybeSetupFunction.defaultClass;
    }

    const transitionClass = compileTransitionClassName(transitions)
    if (!existingTransitions.has(transitionClass)) _mountTransitionClass(transitions)

    if (shouldUseDefaultClass) {
        maybeSetupFunction.defaultClass = transitionClass!;
    }

    return transitionClass!
}


function _mountTransitionClass(transitions: (TransitionKit | TransitionFunction)[]) {
    for (const kit of transitions) {
        if (kit instanceof Function) break;

    }
}

// name: string;
// delay?: number;
// duration?: number;
// timing?: TransitionTiming;

// name-300-ease-d30_name-400-ease-d30

/* 
{
transition: name 
}
*/

function compileTransitionClassName(transitions: (TransitionKit | TransitionFunction)[]) {
    transitions.sort((a, b) => a.name.localeCompare(b.name))
    let className = ''
    for (const kit of transitions) {
        if (kit instanceof Function) break;
        const transition = `${kit.name}-${kit.duration}-${kit.timing}-d${kit.delay}`
        if (className) {
            className = className + '_' + transition
        }
        else {
            className = transition;
        }
    }
    return className
}


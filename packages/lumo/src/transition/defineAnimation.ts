import { createTransitionStyleSheet, getTransitionStylesheet, TransitionTiming } from "./defineTransition";
import { CSSTransitionProperties } from "./types";

export type AnimationFunction = {
    (options?: AnimationOptions) : AnimationKit
    defaultClass: string
}

export type AnimationKit = {
    animation: string;
    delay: number;
    duration: number;
    timing: TransitionTiming;
    iterations: number;
    direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
}

export type AnimationClass = string;

type AnimationOptions = {
    delay?: number;
    duration?: number;
    timing?: TransitionTiming;
    iterations?: number;
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
}

type Keyframes = {
    from: { [K in keyof CSSTransitionProperties]?: CSSTransitionProperties[K] }
    to: { [K in keyof CSSTransitionProperties]?: CSSTransitionProperties[K] }
} | {
    [key: number]: { [K in keyof CSSTransitionProperties]?: CSSTransitionProperties[K] }
}


type AnimationDef = {
    keyframes: Keyframes | string // provide keyframes config or existing animation name
    delay?: number;
    duration?: number;
    timing?: TransitionTiming;
    iterations?: number;
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
}

/**
 * note: delay in ms (default: 0), duration in ms (default: 250), timing (default: 'ease')
 */
export function defineAnimation<F extends (options?: AnimationOptions) => AnimationDef>(name: string, useAnimation: F) {
    const _name = name;
    let keyframesID = '';

    function setUpAnimation(options?: Parameters<F>[0]) {
        const animation = useAnimation(options)
        if (!keyframesID) {
            keyframesID = mountKeyframes(_name, animation.keyframes)
        }
        return {
            animation: keyframesID,
            delay: animation.delay ?? 0,
            duration: animation.duration ?? 250,
            timing: animation.timing ?? 'ease',
            iterations: animation.iterations ?? 1,
            direction: animation.direction ?? 'normal'
        }
    }
    setUpAnimation.defaultClass = ''
    return setUpAnimation
}

function mountKeyframes(name: string, keyframes: Keyframes | string) {
    if (typeof keyframes === 'string') {
        return keyframes;
    }
    const style = getTransitionStylesheet() ?? createTransitionStyleSheet()
    const keyframesCSS = compileKeyframes(keyframes)
    const keyframesID = name; // TODO: manage namespace collisions
    style.insertRule(`@keyframes ${keyframesID} { ${keyframesCSS} }`, style.cssRules.length)
    return keyframesID;
}

//NOTE: Potentially we can use build-time optimizations to pre-compile the animation/transition def to a css`` template literal. 
// Test if it would actually boost performance first.
function compileKeyframes(keyframes: Keyframes) {
    // TODO:
}
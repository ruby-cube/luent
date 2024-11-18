import { NodeEntity } from "../node/makeNode";
import { renderPhaseChangeNode, TransitionConfig } from "./PhaseChange";
import { createTransitionStyleSheet, getTransitionStylesheet, TransitionClasses, TransitionFunction, TransitionKit } from "./defineTransition";
import { AnimationClass, AnimationFunction, AnimationKit } from "./defineAnimation";
import { NodeRef } from "../node/NodeRef";
import { renderIONode } from "./I-O";
import { AnyObject } from "@rue/types";

export type TransitionHook = {
    phase: 'in' | 'out'
}


export type TransitionNode = {
    transitionIn(endTransition: () => void): void,
    transitionOut(endTransition: (cleanup?: () => void) => void): void,
    transitioningOut: boolean,
    animatingOut: boolean,
    cancel(direction: "in" | "out"): void
    pause(direction: "in" | "out", transitionStartTime: number): void
}

const defaultFade: TransitionClasses = {
    offscreenClass: 'offscreen-default-fade',
    transitionClass: 'transition-default-fade'
}

export function createTransitionNode(
    type: 'phasic-node' | 'transit-node',
    Slot: [string] | (() => NodeEntity | NodeEntity[]),
    input: {
        'on-load'?: boolean;
        'with:in'?: AnimationClass | TransitionClasses | TransitionConfig | TransitionConfig[];
        'with:out'?: AnimationClass | TransitionClasses | TransitionConfig | TransitionConfig[];
        with?: AnimationClass | TransitionClasses | TransitionConfig | TransitionConfig[];
        onStart?: (hook: TransitionHook) => void;
        onEnd?: (hook: TransitionHook) => void;
    }
) {
    const { 'with:in': inputIn, 'with:out': inputOut, with: inputBoth, "on-load": shouldTransitionLoad, onEnd, onStart } = input;
    const $div = NodeRef('div')
    console.log('createTransitionNode')

    const [transitionIn, animateIn] = normalizeToKitArrays(inputIn)
    const [transitionOut, animateOut] = normalizeToKitArrays(inputOut)
    const [transitionBoth, animateBoth] = normalizeToKitArrays(inputBoth ? inputBoth : (!inputIn && !inputOut) ? defaultFade : undefined)

    if (__DEV__ && transitionIn && transitionBoth || transitionOut && transitionBoth)
        console.warn(`The transition for 'both' will override transition for either 'in' or 'out'`)

    const transitionInProperties = undefined; //TODO: 
    const transitionOutProperties = undefined; //TODO: 

    const enterFromClasses = collectOffscreenClasses(transitionBoth || transitionIn)
    const transition_in = mountTransitionClass(transitionBoth || transitionIn)
    const animate_in = mountAnimationClass(animateBoth || animateIn)
    const exitClasses = collectOffscreenClasses(transitionBoth || transitionOut)
    const transition_out = transitionBoth ? transition_in : mountTransitionClass(transitionOut)
    const animate_out = transitionBoth ? animate_in : mountAnimationClass(animateOut)

    let frameID: number | undefined;
    let controller: AbortController;

    const transitionNode: TransitionNode = {
        transitionIn(endTransition: () => void) {
            console.log('transition in')
            if (!transition_in && !animate_in) {
                endTransition();
                return;
            }

            const div = $div()!

            if (onStart) onStart({ phase: 'in' })
            controller = new AbortController()

            if (transition_in) {
                if (type === 'transit-node') {
                    div.classList.add(...enterFromClasses!);
                    div.classList.add(transition_in);
                }

                frameID =
                    requestAnimationFrame(() => {
                        frameID = undefined

                        // unpause
                        // if (paused) { //FIX:
                        //     div.style.removeProperty('animation-play-state')
                        //     for (const prop of transitionInProperties) {
                        //         div.style.removeProperty(prop)
                        //     }
                        // }
                        requestAnimationFrame(() => {
                            div.classList.remove(...enterFromClasses!); // triggers enter

                            div.addEventListener(
                                "transitionend",
                                () => {
                                    console.log('end transition in')
                                    div.classList.remove(transition_in); // enter prep
                                    afterTransition()
                                },
                                { once: true, signal: controller.signal }
                            );
                        })

                    });
            }

            if (animate_in) {
                div.classList.add(animate_in);

                div.addEventListener(
                    "animationend",
                    () => {
                        div.classList.remove(animate_in);
                        afterTransition()
                    },
                    { once: true, signal: controller.signal }
                );
            }

            let endTransitionCount = (transition_in ? 1 : 0) + (animate_in ? 1 : 0);

            function afterTransition() {
                endTransitionCount--;
                console.log('afterTransition (in)', endTransitionCount)
                if (endTransitionCount === 0) {
                    if (onEnd) onEnd({ phase: 'in' })
                    endTransition() //transitioning = false 
                }
            }
        },

        transitionOut(endTransition: (cleanup?: () => void) => void) {
            if (!transition_out && !animate_out) {
                endTransition();
                return;
            }
            const div = $div()!
            controller = new AbortController();

            if (onStart) onStart({ phase: 'out' })


            if (transition_out) {
                this.transitioningOut = true;
                frameID =
                    requestAnimationFrame(() => {
                        frameID = undefined

                        // unpause //TODO:
                        // if (paused) {
                        //     unpause(transitionInProperties)
                        // }

                        div.classList.add(transition_out);
                        div.classList.add(...exitClasses!);

                        div.addEventListener(
                            "transitionend",
                            () => afterTransition(() => {
                                this.transitioningOut = false;
                                div.classList.remove(transition_out);
                                div.classList.remove(...exitClasses!);

                                if (type === 'phasic-node' && transition_in) {
                                    div.classList.add(...enterFromClasses!);
                                    div.classList.add(transition_in);
                                }
                            }),
                            { once: true, signal: controller.signal }
                        );
                    })
            }

            if (animate_out) {
                this.animatingOut = true;
                div.classList.add(animate_out);

                div.addEventListener(
                    "animationend",
                    () => afterTransition(() => {
                        this.animatingOut = false;
                        div.classList.remove(animate_out);
                    }),
                    { once: true, signal: controller.signal }
                );
            }

            const transitionCleanups: (() => void)[] = []
            let endTransitionCount = (transition_out ? 1 : 0) + (animate_out ? 1 : 0);

            function afterTransition(cleanup: () => void) {
                endTransitionCount--;
                transitionCleanups.push(cleanup)
                if (endTransitionCount === 0) {
                    endTransition(() => {
                        if (onEnd) onEnd({ phase: 'out' })
                        for (const cleanup of transitionCleanups) {
                            cleanup()
                        }
                    })
                }
            }
        },

        transitioningOut: false,
        animatingOut: false,

        cancel(direction: 'in' | 'out') {
            const div = $div()!
            controller.abort();
            if (direction === 'in') {
                //complete
                if (transition_in) {
                    if (frameID !== undefined)
                        cancelAnimationFrame(frameID)

                    div.classList.remove(transition_in);
                }
                if (animate_in) {
                    div.classList.remove(animate_in);
                }

            }
            else {
                if (transition_out) {
                    this.transitioningOut = false;
                    if (frameID !== undefined)
                        cancelAnimationFrame(frameID)

                    div.classList.remove(transition_out);
                    div.classList.remove(...exitClasses!);

                    if (type === 'phasic-node' && transition_in) {
                        div.classList.add(...enterFromClasses!);
                        div.classList.add(transition_in);
                    }
                }
                if (animate_out) {
                    this.animatingOut = false;
                    div.classList.remove(animate_out);
                }
            }
        },
        pause(direction: 'in' | 'out', transitionStartTime: number) {
            // pause state
            // for (const key in transitionInProperties) {
            //     //TODO: requires A LOT more information to compute transitional state...
            //     const transitionalState = computeTransitionalState(transitionIn.duration, new Date().getTime() - transitionStartTime, 0, -100, '')

            //     div.style.setProperty('transform', `translateX(${transitionalState}px)`);
            // }
            // if (animate_in) div.style.setProperty('animation-play-state', 'pause')
            paused = true;
        }
    }

    let paused = false;

    function unpause(transitionProperties: AnyObject) {
        const div = $div()!
        div.style.removeProperty('animation-play-state')
        if (transitionInProperties) {
            for (const key in transitionProperties) {
                div.style.removeProperty(key)
            }
        }
    }

    function quickFade() {
        const div = $div()
    }


    const renderNode = type === 'transit-node' ? renderIONode : renderPhaseChangeNode

    return renderNode(
        $div,
        Slot,
        transitionNode
    )
}



function normalizeToKitArrays(
    input: AnimationClass | TransitionClasses | TransitionConfig | TransitionConfig[] | undefined
): [
        (TransitionKit | TransitionFunction)[] | undefined | TransitionClasses,
        (AnimationKit | AnimationFunction)[] | undefined | AnimationClass
    ] {
    if (typeof input === 'string')
        return [undefined, input];
    if (input && 'transitionClass' in input) {
        return [input, undefined]
    }

    if (!input) return [undefined, undefined];
    if (input instanceof Function) {
        const transition = input();
        if ('animation' in transition) {
            return [undefined, [transition, <AnimationFunction>input]]
        }
        return [
            [transition, <TransitionFunction>input],
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
                else defaultTransition = <TransitionFunction>config;
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

function collectOffscreenClasses(transitions: (TransitionKit | TransitionFunction)[] | undefined | TransitionClasses) {
    if (!transitions) return undefined;
    if ('transitionClass' in transitions) {
        if (transitions.offscreenClass instanceof Array)
            return [...transitions.offscreenClass];
        return [transitions.offscreenClass]
    };
    const classes: string[] = []
    for (const transition of transitions) {
        if (transition instanceof Function) break;
        classes.push(...transition.offscreenClasses)
    }
    return classes;
}


//TODO: unmount when component unmounted
function mountTransitionClass(transitions: (TransitionKit | TransitionFunction)[] | undefined | TransitionClasses) {
    if (!transitions) return undefined;
    if ('transitionClass' in transitions) return transitions.transitionClass;

    const maybeSetupFunction = transitions.at(-1);
    const shouldUseDefaultClass = maybeSetupFunction instanceof Function
    if (shouldUseDefaultClass && maybeSetupFunction.defaultClass) {
        return maybeSetupFunction.defaultClass;
    }

    const transitionClass = compileTransitionClassName(transitions)
    if (!existingTransitions.has(transitionClass)) _mountTransitionClass(transitionClass, transitions)

    if (shouldUseDefaultClass) {
        maybeSetupFunction.defaultClass = transitionClass!;
    }

    return transitionClass!
}

const existingTransitions: Set<string> = new Set();

function _mountTransitionClass(className: string, transitions: (TransitionKit | TransitionFunction)[]) {
    existingTransitions.add(className);
    const style = getTransitionStylesheet() ?? createTransitionStyleSheet()
    const transition = compileCSSTransition(transitions);
    style.insertRule(`.${className} { transition: ${transition}}`)
    console.log('transition', transition)
}

function compileCSSTransition(transitions: (TransitionKit | TransitionFunction)[]) {
    let cssString = '';
    for (const kit of transitions) {
        if (kit instanceof Function) break;

        const { delay, duration, properties, timing } = kit;

        for (const property of properties) {
            const comma = cssString ? ',' : ''
            cssString = cssString + comma + property + ' ' + duration + 'ms' + ' ' + timing + (delay ? delay + 'ms' : '')
        }
    }

    return cssString;
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

function mountAnimationClass(animations: (AnimationKit | AnimationFunction)[] | undefined | AnimationClass) {
    if (!animations || typeof animations === 'string')
        return animations
    return '' //TODO:
}
import { contextual, defineContextProp, makeElement, NodeEntity, NodeRef } from "@rue/lumo";
import { TransitionHook } from "./TransitionNode";
import { v } from "../InputTypes";



export function renderIONode(
    $div: NodeRef<'div'>,
    Slot: [string] | (() => NodeEntity | NodeEntity[]),
    transitionInProperties: string[],
    transitionOutProperties: string[],
    transition_in: undefined | string,
    enterClasses: undefined | string[],
    transition_out: undefined | string,
    exitClasses: undefined | string[],
    animate_in: undefined | string,
    animate_out: undefined | string,
    onStart: undefined | ((hook: TransitionHook) => void),
    onEnd: undefined | ((hook: TransitionHook) => void)
) {
    registerTransitionNode({
        transitionIn(endTransition: () => void) {
            const div = $div()!

            if (onStart) onStart({ phase: 'in' })
            let endTransitionCount = 0;

            if (transition_in) {
                div.classList.add(...enterClasses!);
                div.classList.add(transition_in);

                requestAnimationFrame(() => {

                    div.style.removeProperty('animation-play-state')
                    for (const prop of transitionInProperties) {
                        div.style.removeProperty(prop)
                    }

                    div.classList.remove(...enterClasses!); // trigger-enter by removal

                    div.addEventListener(
                        "transitionend",
                        () => {
                            div.classList.remove(transition_in); // enter prep
                            endTransitionCount--;
                            if (endTransitionCount === 0) {
                                if (onEnd) onEnd({ phase: 'in' })
                                endTransition() //transitioning = false 
                            }
                        },
                        { once: true }
                    );
                });
            }

            if (animate_in) {
                animateTransition(div, animate_in, () => {
                    endTransitionCount--;
                    if (endTransitionCount === 0) {
                        if (onEnd) onEnd({ phase: 'in' })
                        endTransition() //transitioning = false 
                    }
                })
            }
        },

        pauseTransitionIn() {
            const div = $div()!
            if (transition_in) {
                div.classList.remove(transition_in);
            }
            if (animate_in){
                div.classList.remove(animate_in);
            }
        },

        transitionOut(endTransition: (node: Node) => void) {
            const div = $div()!

            if (onStart) onStart({ phase: 'out' })
            let endTransitionCount = 0;

            if (transition_out) {
                requestAnimationFrame(() => {

                    div.classList.add(transition_out);
                    div.classList.add(...exitClasses!);

                    div.addEventListener(
                        "transitionend",
                        () => {
                            div.classList.remove(...exitClasses!);
                            div.classList.remove(transition_out);

                            endTransitionCount--;
                            if (endTransitionCount === 0) {
                                if (onEnd) onEnd({ phase: 'out' })
                                endTransition(div) //transitioning = false 
                            }
                        },
                        { once: true }
                    );
                })
            }

            if (animate_out) {
                animateTransition(div, animate_out, () => {
                    endTransitionCount--;
                    if (endTransitionCount === 0) {
                        if (onEnd) onEnd({ phase: 'out' })
                        endTransition(div) //transitioning = false 
                    }
                })
            }
        },
        pauseTransitionOut() {
            const div = $div()!;
            if (transition_out) {
                div.classList.remove(...exitClasses!);
                div.classList.remove(transition_out);
            }
            if (animate_out){
                div.classList.remove(animate_out);
            }
        },
        setPauseState(direction: 'in' | 'out', transitionStartTime: number) {
            const div = $div()!
            if (direction === 'in'){
                for (const key in transitionInProperties) {
                    //TODO: requires A LOT more information to compute transitional state...
                    const transitionalState = computeTransitionalState(transitionIn.duration, new Date().getTime() - transitionStartTime, 0, -100, '')
    
                    div.style.setProperty('transform', `translateX(${transitionalState}px)`);
                }
                if (animate_in) div.style.setProperty('animation-play-state', 'pause')
            }
        }
    })
    return makeElement('div', Slot, { ref: $div }, undefined)
}


export function animateTransition(div: HTMLDivElement, className: string, endTransition: (div: Node) => void) {
    div.classList.add(className);

    div.addEventListener(
        "animationend",
        () => {
            div.classList.remove(className);
            endTransition(div)
        },
        { once: true }
    );
}



const REGISTER_TRANSITION_NODE = Symbol('registerTransitionNode')

const pushTransitionNode = defineContextProp(REGISTER_TRANSITION_NODE, v<(transitionNode: TransitionNode) => void>)

declare module '@rue/lumo' {
    interface ContextKeyMap {
        [REGISTER_TRANSITION_NODE]: typeof pushTransitionNode
    }
}

function registerTransitionNode(transitionNode: TransitionNode) {
    contextual(REGISTER_TRANSITION_NODE)(transitionNode)
}

export function useTransitionNodes(){
    const transitionNodes: TransitionNode[] = [];
    return {
        REGISTER_TRANSITION_NODE,
        transitionNodes,
        registerTransitionNode(transitionNode: TransitionNode){
            transitionNodes.push(transitionNode);
        }
    }
}

export type TransitionNode = {
    transitionIn(endTransition: () => void): void,
    transitionOut(endTransition: (node: Node) => void): void,
    cancelTransitionIn(): void;
    cancelTransitionOut(): void;
    pause(direction: "in" | "out", transitionStartTime: number): void
}


export function computeTransitionalState(duration: number, elapsedTime: number, initialState: number, finalState: number, easing: string) {
    //TODO: incorporate easing into computation
    const percentage = elapsedTime / duration;
    return (finalState - initialState) * percentage + initialState;
}



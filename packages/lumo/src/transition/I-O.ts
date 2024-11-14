import { makeElement, NodeEntity, NodeRef } from "@rue/lumo";
import { registerTransitionNode } from "../dynamic/transitions";
import { TransitionHook } from "./TransitionNode";



export function renderIONode(
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
    registerTransitionNode({
        transitionIn(endTransition: () => void) {
            const div = $div()!

            if (transition_in) {
                div.classList.add(...enterClasses!);
                div.classList.add(transition_in);
            }

            requestAnimationFrame(() => {
                if (onStart) onStart({ phase: 'in' })
                let endTransitionCount = 0;

                if (transition_in) {
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
            });
        },
        transitionOut(endTransition: (node: Node) => void) {
            const div = $div()!
            if (onStart) onStart({ phase: 'out' })
            let endTransitionCount = 0;

            if (transition_out) {
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
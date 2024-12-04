import { TransitionNode } from "./TransitionNode";
import { v } from "../InputTypes";
import { NodeRef } from "../node/NodeRef";
import { NodeEntity } from "../node/makeNode";
import { makeElement } from "../element/makeElement";
import { defineContextProp } from "../context/ContextKey";
import { contextual } from "../context/provide";
import { Ion } from "@rue/quarky";
import { Component } from "../component/InternalComponent";
import { Else, If } from "../conditional/If";

export function renderTransitNode(
    $div: NodeRef<'div'>,
    Slot: () => NodeEntity,
    transitionNode: TransitionNode,
    $disable: false | undefined | Ion<boolean>
) {
    if ($disable) {
        const output = Slot instanceof Function ? Slot() : Slot
        return Component(
            [
                If($disable, () =>
                    output
                ),
                Else(() => {
                    registerTransitionNode(transitionNode)
                    return makeElement('div', output, { ref: $div }, undefined)
                })
            ]
        )
    }
    console.log('render transit node')
    registerTransitionNode(transitionNode)
    return makeElement('div', Slot, { ref: $div, class: 'transit' }, undefined)
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

export function useTransitionNodes() {
    console.log('useTransitionNodes')
    const transitionNodes: TransitionNode[] = [];
    return {
        REGISTER_TRANSITION_NODE,
        transitionNodes,
        registerTransitionNode(transitionNode: TransitionNode) {
            console.log('registering transition node')
            transitionNodes.push(transitionNode);
        }
    }
}



export function computeTransitionalState(duration: number, elapsedTime: number, initialState: number, finalState: number, easing: string) {
    //TODO: incorporate easing into computation
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
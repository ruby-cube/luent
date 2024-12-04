import { createNodeContext } from "../context/Context";
import { defineContextProp } from "../context/ContextKey";
import { makeElement } from "../element/makeElement";
import { NodeEntity } from "../node/makeNode";
import { TransitionFunction, TransitionKit, TransitionDef, TransitionClasses } from "./defineTransition";
import { contextual } from "../context/provide";
import { AnimationFunction, AnimationKit } from "./defineAnimation";
import { NodeRef } from "../node/NodeRef";
import { TransitionNode } from "./TransitionNode";
import type { Context as ContextType } from "../context/context-stack";
import { v } from "../InputTypes";
import { Ion } from "@rue/quarky";
import { Component, Slot } from "../component/InternalComponent";
import { Else, If } from "../conditional/If";

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


export function renderPhasicNode(
    $div: NodeRef<'div'>,
    Slot: () => NodeEntity,
    transitionNode: TransitionNode,
    $disable: false | undefined | Ion<boolean>
) {
    if ($disable) {
        const output = Slot instanceof Function ? Slot() : Slot
        return Component([
            If($disable, () =>
                output
            ),
            Else(() => {
                return createPhasicNode(
                    $div,
                    output,
                    transitionNode
                )
            })
        ])
    }
    return createPhasicNode(
        $div,
        Slot,
        transitionNode
    )
}

function createPhasicNode(
    $div: NodeRef<'div'>,
    Slot: Slot,
    transitionNode: TransitionNode,
) {
    let phasicNode: null | TransitionNode = transitionNode

    function _getPhasicNode() {
        const _phaseNode = phasicNode
        phasicNode = null;
        return _phaseNode
    }

    return createNodeContext(() => (
        makeElement('div', Slot, { ref: $div, class: 'phasic' }, undefined)
    ), { with: { [GET_PHASIC_NODE]: _getPhasicNode } })
}

export function getPhasicNode(context?: ContextType) {
    return contextual(GET_PHASIC_NODE)?.()
}









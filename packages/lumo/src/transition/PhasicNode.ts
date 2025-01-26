import { createCommons } from "../commons/Commons";
import { defineContextProp } from "../commons/CommonsKey";
import { makeElement } from "../element/makeElement";
import { NodeEntity } from "../node/makeNode";
import { TransitionFunction, TransitionKit, TransitionDef, TransitionClasses } from "./defineTransition";
import { fromCommons } from "../commons/provide";
import { AnimationFunction, AnimationKit } from "./defineAnimation";
import { NodeRef } from "../node/NodeRef";
import { TransitionNode } from "./TransitionNode";
import type { Context as ContextType } from "../commons/commons-stack";
import { v } from "../InputTypes";
import { Ion } from "@rue/quarky";
import { component, Slot } from "../component/InternalComponent";
import { Else, If } from "../conditional/If";
import { isFunction } from "@rue/utils";

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
        const output = isFunction(Slot) ? Slot() : Slot
        return component([
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

    return createCommons(() => (
        makeElement('div', Slot, { ref: $div, class: 'phasic' }, undefined)
    ), { provide: { [GET_PHASIC_NODE]: _getPhasicNode } })
}

export function getPhasicNode(context?: ContextType) {
    const phasicNode = fromCommons(GET_PHASIC_NODE, context)?.()
    return phasicNode
}









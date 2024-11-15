import { ReactiveGet } from "../../../quarky/src";
import { NodeEntity } from "../node/makeNode";
import { ConditionalKit } from "./ConditionalKit";
import { AnyObject, Booleanny } from "@rue/types";
import { Context } from "../context/context-stack";
import { PhasicNode } from "../transition/PhaseChange";
import { TransitionNode } from "../transition/TransitionNode";

export type RenderConditional = () => NodeEntity[]

export class ConditionalRenderKit extends ConditionalKit<RenderConditional> {

    nodePodIndex?: number

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'mount' = 'create',
        public context: Context,
        public transitionNodes: TransitionNode[],
        optionals?: {
            nodePodIndex?: number,
            $condition?: ReactiveGet<Booleanny>,
            setup?: () => AnyObject,
            phasicNode: TransitionNode | undefined,
        }
    ) {
        super(statementType, renderConditional, optionals?.$condition)
        this.nodePodIndex = optionals?.nodePodIndex
    }
}
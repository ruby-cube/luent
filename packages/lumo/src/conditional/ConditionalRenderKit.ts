import { ReactiveGet } from "../../../quarky/src";
import { ConditionalKit } from "./ConditionalKit";
import { AnyObject, Booleanny } from "@rue/types";
import { Context } from "../context/context-stack";
import { TransitionNode } from "../transition/TransitionNode";
import { _NodePod } from "../node/NodePod";
import { NodeKit } from "../node/setUpNodeEntities";

export type RenderConditional = (parent: Element, nodePod: _NodePod, initialRender?: boolean) => NodeKit[]

export class ConditionalRenderKit extends ConditionalKit<RenderConditional> {

    nodePodIndex?: number

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'mount' = 'create',
        public transitionNodes: TransitionNode[],
        public optionals?: {
            nodePodIndex?: number,
            $condition?: ReactiveGet<Booleanny>,
            // setup?: () => AnyObject,
            // phasicNode: TransitionNode | undefined,
        }
    ) {
        super(statementType, renderConditional, optionals?.$condition)
        this.nodePodIndex = optionals?.nodePodIndex
    }
}
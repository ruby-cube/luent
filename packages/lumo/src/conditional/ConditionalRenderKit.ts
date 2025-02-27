import { ConditionalKit } from "./ConditionalKit";
import { AnyObject, Booleanny } from "@rue/types";
import { TransitionNode } from "../transition/TransitionNode";
import { NodeKit } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { Flask } from "@rue/flask";
import { Ion } from "../InputTypes";

export type RenderConditional = (parent: Element, nodePod: NodePod) => NodeKit[]

export class ConditionalRenderKit extends ConditionalKit<RenderConditional> {

    nodePodIndex?: number

    nodePod: NodePod | undefined;
    flask: Flask | undefined;

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'mount' | undefined = undefined,
        public transitionNodes: TransitionNode[],
        public optionals?: {
            // nodePodIndex?: number,
            $condition?: Ion<Booleanny>,
            // setup?: () => AnyObject,
            // phasicNode: TransitionNode | undefined,
        }
    ) {
        super(statementType, renderConditional, optionals?.$condition)
      //   this.nodePodIndex = optionals?.nodePodIndex
    }
}
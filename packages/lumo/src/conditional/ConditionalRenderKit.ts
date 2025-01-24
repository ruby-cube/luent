import { AnyIon, ReactiveGet } from "../../../quarky/src";
import { ConditionalKit } from "./ConditionalKit";
import { AnyObject, Booleanny } from "@rue/types";
import { TransitionNode } from "../transition/TransitionNode";
import { NodeKit } from "../node/setUpNodeEntities";
import { DynamicNode } from "../dynamic/DynamicNode";
import { NodePod } from "../node/NodePod";

export type RenderConditional = (parent: Element, nodePod: NodePod) => NodeKit[]

export class ConditionalRenderKit extends ConditionalKit<RenderConditional> {

    nodePodIndex?: number

    nodePod: NodePod | undefined;
    dynamicNode: DynamicNode | undefined;

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'mount' | undefined = undefined,
        public transitionNodes: TransitionNode[],
        public optionals?: {
            // nodePodIndex?: number,
            $condition?: AnyIon<Booleanny>,
            // setup?: () => AnyObject,
            // phasicNode: TransitionNode | undefined,
        }
    ) {
        super(statementType, renderConditional, optionals?.$condition)
      //   this.nodePodIndex = optionals?.nodePodIndex
    }
}
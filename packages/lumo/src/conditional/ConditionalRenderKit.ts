import { AnyIon, ReactiveGet } from "../../../quarky/src";
import { ConditionalKit } from "./ConditionalKit";
import { AnyObject, Booleanny } from "@rue/types";
import { TransitionNode } from "../transition/TransitionNode";
import { _NodePod } from "../node/NodePod";
import { NodeKit } from "../node/setUpNodeEntities";
import { NodeVine } from "../dynamic/NodeVine";
import { DynamicNode } from "../dynamic/DynamicNode";

export type RenderConditional = (parent: Element, nodeVine: NodeVine, initialRender?: boolean) => NodeKit[]

export class ConditionalRenderKit extends ConditionalKit<RenderConditional> {

    nodePodIndex?: number

    nodeVine: NodeVine | undefined;
    dynamicNode: DynamicNode | undefined;

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'mount' = 'create',
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
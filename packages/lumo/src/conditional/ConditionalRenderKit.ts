import { ConditionalKit } from "./ConditionalKit";
import { AnyObject, Booleanny } from "@rue/types";
import { TransitionNode } from "../transition/TransitionNode";
import { NodeKit } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { Flask } from "@rue/flask";
import { Ion } from "@rue/quarky";

export type RenderConditional = (parent: Element, nodePod: NodePod) => NodeKit[]

export class ConditionalRenderKit extends ConditionalKit<RenderConditional> {

    nodePodIndex?: number

    nodePod: NodePod | undefined;
    _flask: Flask | undefined;

    get flask(){
      return this._flask
    }

    set flask(flask){
      console.trace('!!! setting flask', flask)
      console.log('!!! setting flask for', this.statementType)
      this._flask = flask
    }

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'mount' | undefined = undefined,
        public transitionNodes: TransitionNode[],
        public optionals?: {
            // nodePodIndex?: number,
            $condition?: Ion<Booleanny> | Booleanny,
            // setup?: () => AnyObject,
            // phasicNode: TransitionNode | undefined,
        }
    ) {
        super(statementType, renderConditional, optionals?.$condition)
      //   this.nodePodIndex = optionals?.nodePodIndex
    }
}
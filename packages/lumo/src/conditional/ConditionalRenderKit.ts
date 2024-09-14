import { AnySignal } from "@rue/muonic";
import { NodeEntity } from "../node/makeNode";
import { ConditionalKit } from "./ConditionalKit";
import { Booleanny } from "@rue/types";
import { InternalComponent } from "../component/InternalComponent";

export type RenderConditional = () => NodeEntity[]

export class ConditionalRenderKit extends ConditionalKit<RenderConditional>{

    nodePodIndex?: number

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'mount' = 'create',
        public component: InternalComponent,
        optionals?: {
            nodePodIndex?: number,
            $condition?: AnySignal<Booleanny>,
        }
    ) { 
        super(statementType, renderConditional, optionals?.$condition)
        this.nodePodIndex = optionals?.nodePodIndex
    }
}
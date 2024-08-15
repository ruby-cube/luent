import { ReactiveSignal } from "@rue/muonic";
import { NodeEntity } from "../node/makeNode";
import { ConditionalKit } from "./ConditionalKit";
import { Booleanny } from "@rue/types";

export type RenderConditional = () => NodeEntity[]

export class ConditionalRenderKit extends ConditionalKit<RenderConditional>{

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'activate' = 'create',
        $condition?: ReactiveSignal<Booleanny>,
    ) { 
        super(statementType, renderConditional, $condition)
    }
}
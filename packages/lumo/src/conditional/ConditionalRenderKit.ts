import { AnySignal, ReactiveGet } from "@rue/muonic";
import { NodeEntity } from "../node/makeNode";
import { ConditionalKit } from "./ConditionalKit";
import { Booleanny } from "@rue/types";
import { ProviderComponent } from "../component/ProviderComponent";

export type RenderConditional = () => NodeEntity[]

export class ConditionalRenderKit extends ConditionalKit<RenderConditional>{

    nodePodIndex?: number

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'mount' = 'create',
        public component: ProviderComponent,
        optionals?: {
            nodePodIndex?: number,
            $condition?: ReactiveGet<Booleanny>,
        }
    ) { 
        super(statementType, renderConditional, optionals?.$condition)
        this.nodePodIndex = optionals?.nodePodIndex
    }
}
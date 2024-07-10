import { ReactiveSignal } from "../muonic/useDerivedSignal"
import { NodeEntity } from "./mx";

export class ConditionalRenderKit {
    constructor(
        public renderConditional: () => NodeEntity[],
        public $condition: ReactiveSignal<boolean>,
        public initialNodeEntities: NodeEntity[],
        public $initialConditions: ReactiveSignal<boolean[]>,
        public initialIndex: number,
        public elseIf?: ElseIfRenderKit[],
        public renderElse?: () => NodeEntity[]
    ) { }
}

export type ElseIfRenderKit = {
    renderConditional: () => NodeEntity[];
    $condition: ReactiveSignal<boolean>;
}
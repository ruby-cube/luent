import { Callback } from "@rue/flask";
import { ReactiveSignal } from "@rue/muonic";
import { ConditionalKit } from "../conditional/ConditionalKit";
import { Booleanny } from "@rue/types";

export class ConditionalWatchKit extends ConditionalKit<Callback> {

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public update: Callback,
        $condition?: ReactiveSignal<Booleanny>,
    ) {
        super(statementType, update, $condition)
    }
}
import { Callback } from "@rue/flask";
import { AnySignal } from "@rue/muonic";
import { ConditionalKit } from "../conditional/ConditionalKit";
import { Booleanny } from "@rue/types";

export class ConditionalWatchKit extends ConditionalKit<Callback> {

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public update: Callback,
        $condition?: AnySignal<Booleanny>,
    ) {
        super(statementType, update, $condition)
    }
}
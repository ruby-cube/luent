import { Callback } from "@rue/flask";
import { ReactiveGet } from "../../../quarky/src";
import { ConditionalKit } from "../conditional/ConditionalKit";
import { Booleanny } from "@rue/types";

export class ConditionalWatchKit extends ConditionalKit<Callback> {

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public update: Callback,
        $condition?: ReactiveGet<Booleanny>,
    ) {
        super(statementType, update, $condition)
    }
}
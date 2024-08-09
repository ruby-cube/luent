import { Callback } from "@rue/flask";
import { ReactiveSignal } from "@rue/muonic";
import { ConditionalKit } from "./ConditionalKit";

export class ConditionalWatchKit extends ConditionalKit<Callback> {

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public update: Callback,
        $condition?: ReactiveSignal<boolean>,
    ) {
        super(statementType, update, $condition)
    }
}
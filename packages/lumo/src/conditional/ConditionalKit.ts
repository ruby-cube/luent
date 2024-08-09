import { ReactiveSignal } from "@rue/muonic";

export class ConditionalKit<T = any> {

    constructor(
        public statementType: 'if' | 'elseIf' | 'else',
        public consequent: T,
        public $condition?: ReactiveSignal<boolean>,
    ) { }
}
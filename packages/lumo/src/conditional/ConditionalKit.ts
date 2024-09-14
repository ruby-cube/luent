import { AnySignal } from "@rue/muonic";
import { Booleanny } from "@rue/types";



export class ConditionalKit<T = any> {

    constructor(
        public statementType: 'if' | 'elseIf' | 'else',
        public consequent: T,
        public $condition?: AnySignal<Booleanny>,
    ) { }
}
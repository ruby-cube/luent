import { ReactiveGet } from "../../../quarky/src";
import { Booleanny } from "@rue/types";



export class ConditionalKit<T = any> {

    constructor(
        public statementType: 'if' | 'elseIf' | 'else',
        public consequent: T,
        public $condition?: ReactiveGet<Booleanny>,
    ) { }
}
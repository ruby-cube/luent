import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { ConditionalSeries } from "./ConditionalSeries";

export class ConditionalRenderSeries extends ConditionalSeries {
    declare statements: ConditionalRenderKit[];

    constructor(
        statements: ConditionalRenderKit[],
        public type: 'create' | 'show' | 'activate',
        makeElseKit: () => ConditionalRenderKit
    ) {
        super(statements, makeElseKit);
    }

    render(index: number) {
        return this.statements[index].renderConditional()
    }
}
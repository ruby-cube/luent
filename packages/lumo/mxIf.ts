import { getWithoutTracking } from "../muonic/DependencyTracker";
import { $, hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal"
import { NodeEntity } from "./mx";

export class InitialConditionalRenderKit {
    constructor(
        // public renderConditional: () => NodeEntity[],
        // public $condition: ReactiveSignal<boolean>,
        public conditionalKits: ConditionalRenderKit[],
        public initialNodeEntities: NodeEntity[],
        public $initialConditions: ReactiveSignal<boolean[]>,
        public initialIndex: number,
        // public elseIf?: ElseIfRenderKit[],
        // public renderElse?: () => NodeEntity[]
    ) { }
}

export type ConditionalRenderKit = {
    $condition?: ReactiveSignal<boolean>,
    renderConditional: () => NodeEntity[],
}
// export class InitialConditionalRenderKit {
//     constructor(
//         public renderConditional: () => NodeEntity[],
//         public $condition: ReactiveSignal<boolean>,
//         public initialNodeEntities: NodeEntity[],
//         public $initialConditions: ReactiveSignal<boolean[]>,
//         public initialIndex: number,
//         public elseIf?: ElseIfRenderKit[],
//         public renderElse?: () => NodeEntity[]
//     ) { }
// }

export type ElseIfRenderKit = {
    renderConditional: () => NodeEntity[];
    $condition: ReactiveSignal<boolean>;
}

type ElseIfThen = [ReactiveSignal<boolean>, () => NodeEntity[]]

// API:
//
// mxIf($active, {
//     then: renderListBlock({
//         text: 'I sad'
//     }),
//     elseIf: [$loading, renderLoadingBlock({
//         text: 'I loading'
//     })],
//     else: renderPlaceholder({
//         text: 'help me'
//     })
// })

type MxIfConfig = {
    then: () => NodeEntity[];
    elseIf?: ElseIfThen[] | [ReactiveSignal<boolean>, () => NodeEntity[]]
    else?: () => NodeEntity[]
}


export function mxIf($condition: ReactiveSignal<boolean>, config: MxIfConfig): InitialConditionalRenderKit {
    const { then: renderConditional, else: renderElse, elseIf: elseIfKit } = config;
    const conditionalKits: ConditionalRenderKit[] = [{ $condition, renderConditional }];
    const conditions = [$condition]; // stop pushing when value is true;
    let conditionMet: boolean = getWithoutTracking($condition) //TODO: not sure if getWithoutTracking is needed
    let initialIndex = 0;
    const $initialConditions = $(() => {
        const values: boolean[] = [];
        for (const $condition of conditions) {
            values.push($condition());
        }
        return values;
    }) // $(() => [$conditionA(), $conditionB()])

    if (elseIfKit) {
        if (hasSignal(elseIfKit[0])) {
            processElseIf((<ElseIfThen>elseIfKit)[0], (<ElseIfThen>elseIfKit)[1])
        }
        else {
            for (const [$condition, renderConditional] of <ElseIfThen[]>elseIfKit) {
                processElseIf($condition, renderConditional);
            }
        }
    }

    if (renderElse) {
        conditionalKits.push({ renderConditional: renderElse })
        if (!conditionMet) initialIndex++;
    }

    function processElseIf($condition: ReactiveSignal<boolean>, renderConditional: () => NodeEntity[]) {
        conditionalKits.push({ renderConditional })
        if (!conditionMet) {
            conditions.push($condition)
            initialIndex++
        }
        conditionMet = getWithoutTracking($condition)
    }

    const nodeEntities = conditionalKits[initialIndex].renderConditional()

    const renderKit = new InitialConditionalRenderKit(conditionalKits, nodeEntities, $initialConditions, initialIndex)

    return renderKit;
}
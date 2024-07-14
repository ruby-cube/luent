import { getWithoutTracking } from "../muonic/DependencyTracker";
import { hasSignal, makeDerivedSignal, ReactiveSignal } from "../muonic/useDerivedSignal"
import { NodeEntity, normalizeRenderOutput } from "./mX";

export class InitialConditionalRenderKit {
    constructor(
        public conditionalKits: ConditionalRenderKit[],
        public initialNodeEntities: NodeEntity[],
        public $initialConditions: ReactiveSignal<boolean[]>,
        public initialIndex: number,
    ) { }
}

export type ConditionalRenderKit = {
    $condition?: ReactiveSignal<boolean>,
    renderConditional: () => NodeEntity[] | NodeEntity,
}

export type ElseIfRenderKit = {
    renderConditional: () => NodeEntity[] | NodeEntity;
    $condition: ReactiveSignal<boolean>;
}

type ElseIfThen = [ReactiveSignal<boolean>, () => NodeEntity[] | NodeEntity]

// API:
//
// _mXIf($active, {
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
    then: () => NodeEntity[] | NodeEntity;
    elseIf?: ElseIfThen[] | [ReactiveSignal<boolean>, () => NodeEntity[] | NodeEntity]
    else?: () => NodeEntity[] | NodeEntity
}

export function genConditionsSignal(conditions: ReactiveSignal<boolean>[]) {
    return makeDerivedSignal(() => {
        const values: boolean[] = [];
        for (const $condition of conditions) {
            values.push($condition());
        }
        return values;
    }) // $(() => [$conditionA(), $conditionB()])
}


export function _mXIf($condition: ReactiveSignal<boolean>, config: MxIfConfig): InitialConditionalRenderKit {
    const { then: renderConditional, else: renderElse, elseIf: elseIfKit } = config;
    const conditionalKits: ConditionalRenderKit[] = [{ $condition, renderConditional }];
    const conditions = [$condition]; // stop pushing when value is true;
    let conditionMet: boolean = getWithoutTracking($condition) //TODO: not sure if getWithoutTracking is needed
    let initialIndex = 0;
    const $initialConditions = genConditionsSignal(conditions);

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

    function processElseIf($condition: ReactiveSignal<boolean>, renderConditional: () => NodeEntity[] | NodeEntity) {
        conditionalKits.push({ renderConditional })
        if (!conditionMet) {
            conditions.push($condition)
            initialIndex++
        }
        conditionMet = getWithoutTracking($condition)
    }

    const nodeEntities = normalizeRenderOutput(conditionalKits[initialIndex].renderConditional())

    const renderKit = new InitialConditionalRenderKit(conditionalKits, nodeEntities, $initialConditions, initialIndex)

    return renderKit;
}
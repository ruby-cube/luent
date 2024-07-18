import { getWithoutTracking } from "../muonic/DependencyTracker";
import { hasSignal, makeDerivedSignal, ReactiveSignal } from "../muonic/useDerivedSignal"
import { NodeEntity, normalizeRenderOutput } from "./mE";

export class ConditionalKit {
    constructor(
        public conditionalKits: ConditionalRenderKit[],
        public initialNodeEntities: NodeEntity[] | ShowIfEntities,
        public $initialConditions: ReactiveSignal<boolean[]>,
        public initialIndex: number,
        public type: 'show' | 'mount' | 'preserve'
    ) { }
}

type ShowIfEntities = (NodeEntity[] | NodeEntity)[]

export type ConditionalRenderKit = { // ManifestationKit
    $condition?: ReactiveSignal<boolean>,
    renderConditional: (() => NodeEntity[] | NodeEntity) | undefined | (() => void), // set display property
}

export type ElseIfRenderKit = {
    renderConditional: () => NodeEntity[] | NodeEntity;
    $condition: ReactiveSignal<boolean>;
}

type ConditionalOptions = {
    transition?: unknown //TODO:,
    preserve?: true
}

// API:
//
// ifCase($active, {
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
type ElseIfMount = [ReactiveSignal<boolean>, () => NodeEntity[] | NodeEntity]

type MountIfConfig = {
    mount: () => NodeEntity[] | NodeEntity;
    elseIf?: ElseIfMount[] | [ReactiveSignal<boolean>, () => NodeEntity[] | NodeEntity]
    else?: () => NodeEntity[] | NodeEntity
}

type ElseIfShow = [ReactiveSignal<boolean>, NodeEntity[] | NodeEntity]

type ShowIfConfig = {
    show: NodeEntity[] | NodeEntity;
    elseIf?: ElseIfShow[] | [ReactiveSignal<boolean>, NodeEntity[] | NodeEntity]
    else?: NodeEntity[] | NodeEntity
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


export function ifCase($condition: ReactiveSignal<boolean>, config: MountIfConfig | ShowIfConfig, options?: ConditionalOptions): ConditionalKit {
    return _mountIf($condition, config, options);
}

function isElseIfCollection(elseIfKit: ElseIfShow | ElseIfShow[] | ElseIfMount | ElseIfMount[]): elseIfKit is ElseIfMount[] | ElseIfShow[] {
    return !hasSignal(elseIfKit[0]);
}

function isRenderFunction(elseValue: (() => NodeEntity[] | NodeEntity) | NodeEntity | NodeEntity[]): elseValue is () => NodeEntity[] | NodeEntity {
    return elseValue instanceof Function;
}

export function _mountIf($condition: ReactiveSignal<boolean>, config: MountIfConfig | ShowIfConfig, options: ConditionalOptions | undefined) {
    const { else: elseValue, elseIf: elseIfKit } = config;
    const renderConditional = 'mount' in config ? config.mount : undefined
    const showIfEntities: ShowIfEntities | undefined = 'show' in config ? [config.show] : undefined;
    const conditionalKits: ConditionalRenderKit[] = [{ $condition, renderConditional }];
    const conditions = [$condition]; // stop pushing when value is true;
    let conditionMet: boolean = getWithoutTracking($condition) //TODO: not sure if getWithoutTracking is needed
    let initialIndex = 0;
    const $initialConditions = genConditionsSignal(conditions);

    // populate conditional kits
    if (elseIfKit) {
        if (isElseIfCollection(elseIfKit)) {
            for (const [$condition, renderConditional] of elseIfKit) {
                processElseIf($condition, renderConditional);
            }
        }
        else {
            processElseIf(elseIfKit[0], elseIfKit[1])
        }
    }

    if (elseValue) {
        processElseValue(elseValue);
        if (!conditionMet) initialIndex++;
    }

    function processElseIf($condition: ReactiveSignal<boolean>, elseIfValue: (() => NodeEntity[] | NodeEntity) | NodeEntity[] | NodeEntity) {
        processElseValue(elseIfValue);
        if (!conditionMet) {
            conditions.push($condition)
            initialIndex++
        }
        conditionMet = getWithoutTracking($condition) //QUESTION: is getWithOutTracking necessary?
    }

    function processElseValue(elseValue: (() => NodeEntity[] | NodeEntity) | NodeEntity[] | NodeEntity) {
        if (isRenderFunction(elseValue)) {
            conditionalKits.push({ renderConditional: elseValue })
        }
        else {
            conditionalKits.push({ renderConditional: undefined });
            showIfEntities!.push(elseValue)
        }
    }

    const nodeEntities = 'mount' in config ? normalizeRenderOutput((<() => NodeEntity[] | NodeEntity>conditionalKits[initialIndex].renderConditional)()) : showIfEntities
    const conditionalType = 'show' in config ? 'show' : options && options.preserve ? 'preserve' : 'mount'
    const renderKit = new ConditionalKit(conditionalKits, nodeEntities!, $initialConditions, initialIndex, conditionalType)

    return renderKit;
}

export function mountIf($condition: ReactiveSignal<boolean>, renderConditional: () => NodeEntity[] | NodeEntity, options?: ConditionalOptions): ConditionalKit {
    return _mountIf($condition, { mount: renderConditional }, options)
}
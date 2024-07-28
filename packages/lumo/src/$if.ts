import { DerivedSignal, getWithoutTracking, hasSignal, makeDerivedSignal, ReactiveObject, ReactiveSignal } from "@rue/muonic";
import { getCurrentComponent, InternalComponent } from "./component";
import { _NodePod } from "./NodePod";
import { NodeEntity, RenderFunction } from "./makeNode";
import { normalizeToArray } from "@rue/utils";
import { watchForRender, watchRenderEffect } from "./watchForRender";
import { onActivated, onDeactivated } from "./lifecycle";

export type RenderConditional = () => NodeEntity[]

type ConditionalOptions = {
    transition?: unknown //TODO:,
}

export class ConditionalSeries {
    conditionalKits: ConditionalRenderKit[] = [];
    conditions: ReactiveSignal<boolean>[] = [];
    conditionMet: boolean = false;

    constructor(
        public type: 'create' | 'show' | 'activate'
    ) { }

    addRenderKit(renderKit: ConditionalRenderKit) {
        this.conditionalKits.push(renderKit);
        const $condition = renderKit.$condition;
        if (!this.conditionMet && $condition) {
            this.conditions.push($condition)
        }
    }

    addElse() {
        this.conditionalKits.push(new ConditionalRenderKit('else', () => []))
    }

    evaluateConditions() {
        const conditionalKits = this.conditionalKits;
        for (let i = 0; i < conditionalKits.length; i++) {
            const $condition = conditionalKits[i].$condition
            if ($condition) this.conditions.push($condition);
            if ($condition && getWithoutTracking($condition) || !$condition) {
                return {
                    activeIndex: i,
                    $conditions: genConditionsSignal(this.conditions)
                };
            }
        }
        throw new Error('Else case is missing')
    }

    render(index: number) {
        return this.conditionalKits[index].renderConditional()
    }
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

// let conditionalSeries: ConditionalSeries | undefined;

// export function startConditionalSeries(type: 'create' | 'show' | 'activate' | 'elseIf' | 'else') {
//     if (type === 'else' || type === 'elseIf') throw new Error('Cannot start a conditional series with an else block')
//     conditionalSeries = new ConditionalSeries(type);
// }

// export function getConditionalSeries() {
//     return conditionalSeries;
// }

export class ConditionalRenderKit {

    constructor(
        public statement: 'if' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public type: 'create' | 'show' | 'activate' = 'create',
        public $condition?: ReactiveSignal<boolean>,
    ) { }
}

let currentConditionalType: 'create' | 'show' | 'activate' = 'create'

export function $if($condition: ReactiveSignal<boolean>, renderConditional: RenderFunction,): ConditionalRenderKit
export function $if($condition: ReactiveSignal<boolean>, type: 'create' | 'show' | 'activate', renderConditional: RenderFunction,): ConditionalRenderKit
export function $if($condition: ReactiveSignal<boolean>, param2: 'create' | 'show' | 'activate' | RenderFunction, renderConditional?: RenderFunction,): ConditionalRenderKit {
    const typeSpecified = typeof param2 === "string";
    const renderFunction = typeSpecified ? renderConditional : param2;
    const type = typeSpecified ? param2 : 'create';
    if (!renderFunction) throw new Error('render function is missing');
    currentConditionalType = type;
    return _if($condition, renderFunction, 'if', type)
}

function _if($condition: ReactiveSignal<boolean>, renderConditional: RenderFunction, statement: 'if' | 'elseIf' = 'if', type: 'create' | 'show' | 'activate' = currentConditionalType) {
    const _renderConditional = type === 'activate' ? wrapToPreserve(renderConditional) : wrapToNormalize(renderConditional)
    return new ConditionalRenderKit(statement, _renderConditional, type, $condition)
}

export function $elseIf($condition: ReactiveSignal<boolean>, renderConditional: RenderFunction) {
    return _if($condition, renderConditional, 'elseIf')
}

export function $else(renderConditional: RenderFunction) {
    const type = currentConditionalType;
    return new ConditionalRenderKit('else', renderConditional, currentConditionalType)
}



export function noElseBlock(statements: ConditionalRenderKit[]) {
    if (statements.length === 0) throw new Error(`Conditional series is empty`)
    if (statements.at(-1)!.statement !== 'else') return true;
    return false;
}

export function validateStandAloneConditional(conditionalKit: ConditionalRenderKit, nodeEntities: NodeEntity[], index: number) {
    if (conditionalKit.statement !== 'if') throw new Error(`$${conditionalKit.type} conditional must be contained in a fragment that begins with $if`)
    const nextEntity = nodeEntities[index + 1];
    if (nextEntity instanceof ConditionalRenderKit && nextEntity.statement !== 'if') throw new Error(`A series of conditional statements must be enclosed in a fragment`)
}

// $activateIf

let _preserveAll = false;

export function preserveAllRequested() {
    return _preserveAll;
}

function wrapToPreserve(renderConditional: RenderFunction) {
    let nodeEntities: NodeEntity[];
    return () => {
        if (!nodeEntities) {
            _preserveAll = true;
            nodeEntities = normalizeToArray(renderConditional());
            _preserveAll = false;
            return nodeEntities;
        }
        return nodeEntities;
    }
}

function wrapToNormalize(renderConditional: RenderFunction) {
    return () => normalizeToArray(renderConditional())
}




export function buildConditionalSeries(statements: ConditionalRenderKit[]) {
    const series = new ConditionalSeries(statements[0].type)
    for (let i = 0; i < statements.length; i++) {
        const kit = statements[i]
        if (i === 0 && kit.statement !== 'if' || i !== 0 && kit.statement === 'if') {
            if (__DEV__) throw new Error('$if must be the first child of a conditional series')
            else continue;
        }
        if (!(kit instanceof ConditionalRenderKit)) {
            if (__DEV__) throw new Error("Conditional series can only contain conditional statements created by the $if, $elseIf, and $else functions")
            else continue;
        }
        if (i !== statements.length - 1 && kit.statement === 'else') {
            if (__DEV__) throw new Error("$else must be the very last statement of a conditional series");
            else continue;
        }
        series.addRenderKit(kit);
    }
    if (noElseBlock(statements)) {
        series.addElse()
    }
    series.evaluateConditions()
    return series;
}


// function validateConditionalStatements(statements: ConditionalRenderKit[]) {

// }


export function watchForRenderAndPreserve(target: ReactiveSignal<any> | ReactiveObject, handler: (newValue: any, oldValue: any) => void, options?: { once: true }) {
    const component = getCurrentComponent();
    if (!component) throw new Error("No component found")

    const watcher = watchForRender(target, handler, options);
    const oldValue = hasSignal(target) ? target : target instanceof Array ? [...target] : { ...target } //TODO: doesn't account for sets or maps
    onDeactivated(() => {
        watcher.stop()
    })
    if (hasSignal(target)) {
        onActivated(() => {
            handler(target(), oldValue)
            // pushComponent(component)
            watchForRender(target, handler, options)
            // popComponent()
        })
    }
    else {
        onActivated(() => {
            handler(target, oldValue)
            // pushComponent(component)
            watchForRender(target, handler, options)
            // popComponent()
        })
    }
}

export function watchRenderEffectAndPreserve(handler: () => void) {
    const watcher = watchRenderEffect(handler);

    onDeactivated(() => {
        watcher.stop()
    })

    onActivated(() => {
        watchRenderEffect(handler)
    })
}
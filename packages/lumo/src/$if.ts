import { getWithoutTracking, makeDerivedSignal, ReactiveSignal } from "@rue/muonic";
import { InternalComponent } from "./component";
import { _NodePod } from "./NodePod";
import { NodeEntity, RenderFunction } from "./makeNode";
import { RenderConditional } from "./mountIf";
import { normalizeToArray } from "@rue/utils";



type ConditionalOptions = {
    transition?: unknown //TODO:,
}

export class ConditionalSeries {
    conditionalKits: ConditionalRenderKit[] = [];
    conditions: ReactiveSignal<boolean>[] = [];
    conditionMet: boolean = false;
    activeIndex = 0;
    $conditions = genConditionsSignal(this.conditions);

    constructor(
        public type: 'create' | 'show' | 'activate'
    ) { }

    addRenderKit(renderKit: ConditionalRenderKit) {
        this.conditionalKits.push(renderKit);
        const $condition = renderKit.$condition;
        if (!this.conditionMet) {
            if ($condition) {
                this.conditions.push($condition)
                // this.conditionMet = getWithoutTracking($condition) //QUESTION: is getWithOutTracking necessary?
            }
            // this.activeIndex++
        }
    }

    addElse() {
        this.conditionalKits.push(new ConditionalRenderKit('else', () => []))
        // if (!this.conditionMet) this.activeIndex++;
    }

    evaluateConditions() {
        const conditionalKits = this.conditionalKits;
        for (let i = 0; i < conditionalKits.length; i++) {
            const $condition = conditionalKits[i].$condition
            if ($condition) this.conditions.push($condition);
            if ($condition && getWithoutTracking($condition) || !$condition) {
                this.activeIndex = i;
                return this.$conditions = genConditionsSignal(this.conditions);
            }
        }
        throw new Error('Else case is missing')
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

let conditionalSeries: ConditionalSeries | undefined;

export function startConditionalSeries(type: 'create' | 'show' | 'activate' | 'elseIf' | 'else') {
    if (type === 'else' || type === 'elseIf') throw new Error('Cannot start a conditional series with an else block')
    conditionalSeries = new ConditionalSeries(type);
}

export function getConditionalSeries() {
    return conditionalSeries;
}

export class ConditionalRenderKit {
    isEnd: boolean = false;
    isStart: boolean = false;

    constructor(
        public type: 'create' | 'show' | 'activate' | 'elseIf' | 'else',
        public renderConditional: RenderConditional,
        public $condition?: ReactiveSignal<boolean>,
    ) {
        if (type === 'else') {
            this.isEnd = true;
        }
        else if (type !== 'elseIf') {
            this.isStart = true;
        }
    }
    markEnd() {
        this.isEnd = true;
    }
}

function $if($condition: ReactiveSignal<boolean>, renderConditional: RenderFunction, type: 'create' | 'show' | 'activate' | 'elseIf'): ConditionalRenderKit {
    const _renderConditional = type === 'activate' ? wrapToPreserve(renderConditional) : wrapToNormalize(renderConditional)
    return new ConditionalRenderKit(type, _renderConditional, $condition)
}


export function $createIf($condition: ReactiveSignal<boolean>, renderConditional: RenderFunction) {
    return $if($condition, renderConditional, 'create')
}

export function $showIf($condition: ReactiveSignal<boolean>, renderConditional: RenderFunction) {
    return $if($condition, renderConditional, 'show')
}

export function $activateIf($condition: ReactiveSignal<boolean>, renderConditional: RenderFunction) {
    return $if($condition, renderConditional, 'activate')
}

export function $elseIf($condition: ReactiveSignal<boolean>, renderConditional: RenderFunction) {
    return $if($condition, renderConditional, 'elseIf')
}

export function $else(renderConditional: RenderFunction) {
    return new ConditionalRenderKit('else', renderConditional)
}


export function isConditionalSeriesEnd(index: number, nodeEntities: NodeEntity[]) {
    if (index === nodeEntities.length - 1) return true;
    if (!(nodeEntities[index + 1] instanceof ConditionalRenderKit)) return true;
    if (nodeEntities[index + 1].isStart) return true;
    return false;
}


export function setUpConditionalRenderKit(
    component: InternalComponent,
    parent: HTMLElement,
    renderKit: ConditionalRenderKit,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
) {
    const conditionalSeries = getConditionalSeries();

}

export function noElseBlock(renderKit: ConditionalRenderKit) {
    if (renderKit.isEnd && renderKit.type !== 'else')
        return true;
    return false;
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
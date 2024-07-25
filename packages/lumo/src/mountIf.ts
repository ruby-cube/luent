import { getWithoutTracking } from "../../muonic/DependencyTracker";
import { DerivedSignal, hasSignal, makeDerivedSignal, ReactiveSignal } from "../../muonic/useDerivedSignal"
import { ReactiveObject } from "../../muonic/useReactivize";
import { onActivated, onDeactivated } from "./lifecycle";
import { NodeEntity, normalizeRenderOutput } from "./mE";
import { watchRenderEffect, watchForRender } from "./watchForRender";
import { getCurrentComponent, InternalComponent, popComponent, pushComponent } from "./component";
import { Signal } from "../../muonic/useSignalize";

export class ConditionalKit {
    constructor(
        public conditionalKits: ConditionalRenderKit[],
        public initialNodeEntities: NodeEntity[],
        public $initialConditions: ReactiveSignal<boolean[]>,
        public initialIndex: number,
    ) { }
}

type ShowIfEntities = NodeEntity[] | NodeEntity;
export type MountIfRenderersConfig = (() => NodeEntity)[] | (() => NodeEntity)
export type MountIfRenderers = ((() => NodeEntity) | NodeEntity)[] | (() => NodeEntity)

export type ConditionalRenderKit = { // ManifestationKit
    $condition?: ReactiveSignal<boolean>,
    renderConditional: () => NodeEntity[]
    // (() => NodeEntity[] | NodeEntity) | undefined | (() => void), // set display property
}

export type ElseIfRenderKit = {
    renderConditional: () => NodeEntity[];
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
type ElseIfMount = [ReactiveSignal<boolean>, MountIfRenderersConfig]

type MountIfConfig = {
    mount: MountIfRenderersConfig;
    elseIf?: [ReactiveSignal<boolean>, MountIfRenderersConfig] | ElseIfMount[]
    // elseIf?: ElseIfMount[] | [Signal<boolean>, MountIfRenderers] | [DerivedSignal<boolean>, MountIfRenderers]
    else?: MountIfRenderersConfig
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
    if ('mount' in config) return _mountIf($condition, config, options);
    // return _showIf($condition, config, options)
}

function isElseIfCollection(elseIfKit: ElseIfShow | ElseIfShow[] | ElseIfMount | ElseIfMount[]): elseIfKit is ElseIfMount[] | ElseIfShow[] {
    return !hasSignal(elseIfKit[0]);
}

// function isRenderFunction(elseValue: (() => NodeEntity[] | NodeEntity) | NodeEntity | NodeEntity[]): elseValue is () => NodeEntity[] | NodeEntity {
//     return elseValue instanceof Function;
// }

let _preserveAll = false;

export function preserveAllRequested() {
    return _preserveAll;
}

let _isSettingUpConditionalMount = false;

export function isSettingUpConditionalMount() {
    return _isSettingUpConditionalMount;
}

function wrapRenderersWithContext(conditionalRenderers: MountIfRenderersConfig, preserve: boolean): MountIfRenderersConfig {
    if (conditionalRenderers instanceof Array) {
        const renderers = []
        for (const renderer of conditionalRenderers) {
            const _renderer = wrapWithContext(renderer, preserve)
            renderers.push(_renderer)
        }
        return renderers;
    }
    return [wrapWithContext(conditionalRenderers, preserve)] // normalize to array
}

function wrapWithContext(renderConditional: () => NodeEntity, preserve: boolean) {
    if (!preserve) return () => {
        _isSettingUpConditionalMount = true;
        const nodeEntity = renderConditional()
        _isSettingUpConditionalMount = false;
        return nodeEntity;
    }
    return () => {
        _isSettingUpConditionalMount = true;
        _preserveAll = true;
        const nodeEntity = renderConditional()
        _preserveAll = false;
        _isSettingUpConditionalMount = false;
        return nodeEntity
    }
}


function renderConditional_initial(renderers: (() => NodeEntity)[]): NodeEntity[] | NodeEntity {
    const nodeEntities = []
    for (let i = 0; i < renderers.length; i++) {
        const render = renderers[i];
        const output = render();
        if (output instanceof InternalComponent && output.preserve) {
            //@ts-ignore
            renderers[i] = output;
        }
        nodeEntities.push(output);
    }
    return nodeEntities;
}

function renderConditional(renderers: (() => NodeEntity)[]) {
    const nodeEntities = []
    for (const render of renderers) {
        nodeEntities.push(render instanceof Function ? render() : render)
    }
    return nodeEntities;
}

function composeConditionalRenderer(conditionalRenderers: MountIfRenderersConfig, preserve: boolean) {
    let initialized = false;
    const renderers = wrapRenderersWithContext(conditionalRenderers, preserve)
    return () => {
        if (!initialized) {
            initialized = true;
            return renderConditional_initial(renderers);
        }
        return renderConditional(renderers);
    }
}

export function _mountIf($condition: ReactiveSignal<boolean>, config: MountIfConfig, options: ConditionalOptions | undefined) {
    const { else: elseValue, elseIf: elseIfKit } = config;
    const preserveAll = options && options.preserve || false;
    const renderConditional = composeConditionalRenderer(config.mount, preserveAll)
    // const showIfEntities: ShowIfEntities | undefined = 'show' in config ? [config.show] : undefined;
    const conditionalKits: ConditionalRenderKit[] = [{ $condition, renderConditional }];
    const conditions = [$condition]; // stop pushing when value is true;
    let conditionMet: boolean = getWithoutTracking($condition) //TODO: not sure if getWithoutTracking is needed
    let initialIndex = 0;
    const $initialConditions = genConditionsSignal(conditions);

    // populate conditional kits
    if (elseIfKit) {
        if (isElseIfCollection(elseIfKit)) {
            for (const [$condition, renderers] of elseIfKit) {
                processElseIf($condition, composeConditionalRenderer(renderers, preserveAll));
            }
        }
        else {
            processElseIf(elseIfKit[0], elseIfKit[1])
        }
    }

    if (elseValue) {
        conditionalKits.push({ renderConditional: composeConditionalRenderer(elseValue, preserveAll) })
        if (!conditionMet) initialIndex++;
    }

    conditionalKits.push({ renderConditional: () => [] })
    if (!conditionMet) initialIndex++;


    function processElseIf($condition: ReactiveSignal<boolean>, elseIfValue: MountIfRenderersConfig) {
        conditionalKits.push({ $condition, renderConditional: composeConditionalRenderer(elseIfValue, preserveAll) })
        if (!conditionMet) {
            conditions.push($condition)
            initialIndex++
            conditionMet = getWithoutTracking($condition) //QUESTION: is getWithOutTracking necessary?
        }
    }

    const nodeEntities = normalizeRenderOutput(conditionalKits[initialIndex].renderConditional())
    return new ConditionalKit(conditionalKits, nodeEntities, $initialConditions, initialIndex)
}

// export function composeConditions(conditionalKits: ConditionalRenderKit[]) {
//     let conditionMet = false;
//     const conditions: ReactiveSignal<boolean>[] = []
//     for (const { $condition } of conditionalKits) {
//         if (conditionMet) break;
//         if ($condition) {
//             conditions.push($condition);
//             conditionMet = getWithoutTracking($condition);
//         }
//     }
//     return conditions
// }



export function mountIf($condition: ReactiveSignal<boolean>, renderConditional: () => NodeEntity[] | NodeEntity, options?: ConditionalOptions): ConditionalKit {
    return _mountIf($condition, { mount: renderConditional }, options)
}


export function watchForRenderAndPreserve(target: ReactiveSignal<any> | ReactiveObject, handler: (newValue: any, oldValue: any) => void, options?: { once: true }) {
    const component = getCurrentComponent();
    if (!component || component === "root") throw new Error("No component found")

    const watcher = watchForRender(target, handler, options);
    const oldValue = hasSignal(target) ? target : target instanceof Array ? [...target] : { ...target } //TODO: doesn't account for sets or maps
    onDeactivated(() => {
        watcher.stop()
    })
    if (hasSignal(target)) {
        onActivated(() => {
            handler(target(), oldValue)
            pushComponent(component)
            watchForRender(target, handler, options)
            popComponent()
        })
    }
    else {
        onActivated(() => {
            handler(target, oldValue)
            pushComponent(component)
            watchForRender(target, handler, options)
            popComponent()
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
import { DerivedSignal, getWithoutTracking, hasSignal, ReactiveModel, ReactiveSignal, toRaw } from "@rue/muonic";
import { _NodePod } from "../node/NodePod";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { shallowClone } from "@rue/muonic";
import { AnyObject, Booleanny } from "@rue/types";
import { getCurrentComponent } from "../component/componentStack";
import { getComponent, InternalComponent } from "../component/InternalComponent";



type ConditionalOptions = {
    transition?: unknown //TODO:,
}


let currentNodePodIndex: number | undefined = undefined
function resetCurrentNodePodIndex(index?: number) {
    currentNodePodIndex = index ?? undefined;
}

// export function $if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit
// export function $if($condition: ReactiveSignal<Booleanny>, type: 'create' | 'show' | 'mount', renderConditional: RenderFunction,): ConditionalRenderKit
// export function $if($condition: ReactiveSignal<Booleanny>, param2: 'create' | 'show' | 'mount' | RenderFunction, renderConditional?: RenderFunction,): ConditionalRenderKit {
//     const typeSpecified = typeof param2 === "string";
//     const renderFunction = typeSpecified ? renderConditional : param2;
//     const type = typeSpecified ? param2 : 'create';
//     if (!renderFunction) throw new Error('render function is missing');
//     currentRenderType = type;
//     return _if($condition, renderFunction, 'if', type)
// }



export function create_if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit {
    resetCurrentNodePodIndex()
    return new ConditionalRenderKit(
        'if',
        wrapToNormalize(renderConditional),
        'create',
        getComponent(create_if.name),
        { $condition }
    )
}

export function else_create_if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction) {
    return new ConditionalRenderKit(
        'elseIf',
        wrapToNormalize(renderConditional),
        'create',
        getComponent(else_create_if.name),
        { $condition }
    )
}

export function else_create(renderConditional: RenderFunction) {
    return new ConditionalRenderKit(
        'else',
        wrapToNormalize(renderConditional),
        'create',
        getComponent(else_create.name),
    )
}

export function mount_if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit {
    resetCurrentNodePodIndex()
    return new ConditionalRenderKit(
        'if',
        wrapToPreserve(renderConditional),
        'mount',
        getComponent(mount_if.name),
        { $condition }
    )
}

export function else_mount_if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction) {
    return new ConditionalRenderKit(
        'elseIf',
        wrapToPreserve(renderConditional),
        'mount',
        getComponent(else_mount_if.name),
        { $condition }
    )
}

export function else_mount(renderConditional: RenderFunction) {
    return new ConditionalRenderKit(
        'else',
        wrapToPreserve(renderConditional),
        'mount',
        getComponent(else_mount.name),
    )
}

export function show_if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit {
    resetCurrentNodePodIndex(0)
    return new ConditionalRenderKit(
        'if',
        wrapToNormalize(renderConditional),
        'show',
        getComponent(show_if.name),
        { $condition }
    )
}

export function else_show_if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction) {
    if (currentNodePodIndex === undefined)
        currentNodePodIndex = 0;
    else currentNodePodIndex++;
    return new ConditionalRenderKit(
        'elseIf',
        wrapToNormalize(renderConditional),
        'show',
        getComponent(else_show_if.name),
        { nodePodIndex: currentNodePodIndex, $condition }
    )
}

export function else_show(renderConditional: RenderFunction) {
    if (currentNodePodIndex === undefined)
        currentNodePodIndex = 0;
    else currentNodePodIndex++;
    return new ConditionalRenderKit(
        'else',
        wrapToNormalize(renderConditional),
        'show',
        getComponent(else_show.name),
        { nodePodIndex: currentNodePodIndex }
    )
}

// function _if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction, statementType: 'if' | 'elseIf' = 'if', type: 'create' | 'show' | 'mount' = currentRenderType) {
//     const _renderConditional = type === 'mount' ? wrapToPreserve(renderConditional) : wrapToNormalize(renderConditional)
//     return new ConditionalRenderKit(statementType, _renderConditional, type, $condition)
// }

// export function $elseIf($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction) {
//     return _if($condition, renderConditional, 'elseIf')
// }

// export function $else(renderConditional: RenderFunction) {
//     const type = currentRenderType;
//     const _renderConditional = type === 'mount' ? wrapToPreserve(renderConditional) : wrapToNormalize(renderConditional)
//     return new ConditionalRenderKit('else', _renderConditional, currentRenderType)
// }






function wrapToPreserve(renderConditional: RenderFunction) {
    let nodeEntities: NodeEntity[];
    return () => {
        if (!nodeEntities) {
            nodeEntities = normalizeToArray(renderConditional());
            return nodeEntities;
        }
        return nodeEntities;
    }
}

function wrapToNormalize(renderConditional: RenderFunction) {
    return () => normalizeToArray(renderConditional())
}







// function validateConditionalStatements(statements: ConditionalRenderKit[]) {

// }


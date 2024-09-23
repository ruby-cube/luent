import { _NodePod } from "../node/NodePod";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { AnyObject, Booleanny } from "@rue/types";
import { ReactiveGet } from "../../../quarky/src";
import { getProviderComponent } from "../component/ProviderComponent";



type ConditionalOptions = {
    transition?: unknown //TODO:,
}


let currentNodePodIndex: number | undefined = undefined
function resetCurrentNodePodIndex(index?: number) {
    currentNodePodIndex = index ?? undefined;
}

// export function $if($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit
// export function $if($condition: ReactiveGet<Booleanny>, type: 'create' | 'show' | 'mount', renderConditional: RenderFunction,): ConditionalRenderKit
// export function $if($condition: ReactiveGet<Booleanny>, param2: 'create' | 'show' | 'mount' | RenderFunction, renderConditional?: RenderFunction,): ConditionalRenderKit {
//     const typeSpecified = typeof param2 === "string";
//     const renderFunction = typeSpecified ? renderConditional : param2;
//     const type = typeSpecified ? param2 : 'create';
//     if (!renderFunction) throw new Error('render function is missing');
//     currentRenderType = type;
//     return _if($condition, renderFunction, 'if', type)
// }



export function CreateIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit {
    resetCurrentNodePodIndex()
    return new ConditionalRenderKit(
        'if',
        wrapToNormalize(renderConditional),
        'create',
        getProviderComponent(CreateIf.name),
        { $condition }
    )
}

export function ElseCreateIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction) {
    return new ConditionalRenderKit(
        'elseIf',
        wrapToNormalize(renderConditional),
        'create',
        getProviderComponent(ElseCreateIf.name),
        { $condition }
    )
}

export function ElseCreate(renderConditional: RenderFunction) {
    return new ConditionalRenderKit(
        'else',
        wrapToNormalize(renderConditional),
        'create',
        getProviderComponent(ElseCreate.name),
    )
}

export function MountIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit {
    resetCurrentNodePodIndex()
    return new ConditionalRenderKit(
        'if',
        wrapToPreserve(renderConditional),
        'mount',
        getProviderComponent(MountIf.name),
        { $condition }
    )
}

export function ElseMountIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction) {
    return new ConditionalRenderKit(
        'elseIf',
        wrapToPreserve(renderConditional),
        'mount',
        getProviderComponent(ElseMountIf.name),
        { $condition }
    )
}

export function ElseMount(renderConditional: RenderFunction) {
    return new ConditionalRenderKit(
        'else',
        wrapToPreserve(renderConditional),
        'mount',
        getProviderComponent(ElseMount.name),
    )
}

export function ShowIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit {
    resetCurrentNodePodIndex(0)
    return new ConditionalRenderKit(
        'if',
        wrapToNormalize(renderConditional),
        'show',
        getProviderComponent(ShowIf.name),
        { $condition }
    )
}

export function ElseShowIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction) {
    if (currentNodePodIndex === undefined)
        currentNodePodIndex = 0;
    else currentNodePodIndex++;
    return new ConditionalRenderKit(
        'elseIf',
        wrapToNormalize(renderConditional),
        'show',
        getProviderComponent(ElseShowIf.name),
        { nodePodIndex: currentNodePodIndex, $condition }
    )
}

export function ElseShow(renderConditional: RenderFunction) {
    if (currentNodePodIndex === undefined)
        currentNodePodIndex = 0;
    else currentNodePodIndex++;
    return new ConditionalRenderKit(
        'else',
        wrapToNormalize(renderConditional),
        'show',
        getProviderComponent(ElseShow.name),
        { nodePodIndex: currentNodePodIndex }
    )
}

// function _if($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction, statementType: 'if' | 'elseIf' = 'if', type: 'create' | 'show' | 'mount' = currentRenderType) {
//     const _renderConditional = type === 'mount' ? wrapToPreserve(renderConditional) : wrapToNormalize(renderConditional)
//     return new ConditionalRenderKit(statementType, _renderConditional, type, $condition)
// }

// export function $elseIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction) {
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


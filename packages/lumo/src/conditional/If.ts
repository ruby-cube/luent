import { _NodePod } from "../node/NodePod";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { AnyObject, Booleanny } from "@rue/types";
import { ReactiveGet } from "../../../quarky/src";
import { getContext } from "../context/context-stack";





let currentNodePodIndex: number | undefined = undefined
function resetCurrentNodePodIndex(index?: number) {
    currentNodePodIndex = index ?? undefined;
}

// export function If($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit
// export function If($condition: ReactiveGet<Booleanny>, type: 'create' | 'show' | 'mount', renderConditional: RenderFunction,): ConditionalRenderKit
// export function If($condition: ReactiveGet<Booleanny>, param2: 'create' | 'show' | 'mount' | RenderFunction, renderConditional?: RenderFunction,): ConditionalRenderKit {
//     const typeSpecified = typeof param2 === "string";
//     const renderFunction = typeSpecified ? renderConditional : param2;
//     const type = typeSpecified ? param2 : 'create';
//     if (!renderFunction) throw new Error('render function is missing');
//     currentRenderType = type;
//     return _if($condition, renderFunction, 'if', type)
// }

type ConditionalOptions = {
    type?: 'show/hide' | 'create/destroy',
    setup?: () => AnyObject,
}

type RenderConditional<OPT> = OPT extends { setup: infer S } ? S extends (...args: any) => any ? RenderFunction<[ReturnType<S>]> : RenderFunction : RenderFunction

export function If($condition: (_?: any) => Booleanny, renderConditional: RenderFunction | NodeEntity | NodeEntity[]): ConditionalRenderKit
export function If<OPT extends ConditionalOptions>($condition: (_?: any) => Booleanny, options: OPT, renderConditional: RenderConditional<OPT>): ConditionalRenderKit
export function If<OPT extends ConditionalOptions>($condition: (_?: any) => Booleanny, optionsOrRenderConditional: NodeEntity | NodeEntity[] | RenderFunction | OPT, renderConditional?: RenderConditional<OPT>): ConditionalRenderKit {
    const _renderConditional = renderConditional ? renderConditional : optionsOrRenderConditional as RenderFunction
    const options = renderConditional ? optionsOrRenderConditional as ConditionalOptions : { type: 'create/destroy' as const, setup: undefined };
    if (options.type === 'show/hide') {
        return ShowIf($condition, _renderConditional, options)
    }

    resetCurrentNodePodIndex()
    return new ConditionalRenderKit(
        'if',
        wrapToNormalize(_renderConditional),
        'create',
        getContext(),
        { $condition, setup: options.setup }
    )
}


export function ElseIf($condition: (_?: any) => Booleanny, renderConditional: RenderFunction | NodeEntity | NodeEntity[]): ConditionalRenderKit
export function ElseIf<OPT extends ConditionalOptions>($condition: (_?: any) => Booleanny, options: OPT, renderConditional: RenderConditional<OPT>): ConditionalRenderKit
export function ElseIf<OPT extends ConditionalOptions>($condition: (_?: any) => Booleanny, optionsOrRenderConditional: NodeEntity | NodeEntity[] | RenderFunction | OPT, renderConditional?: RenderConditional<OPT>): ConditionalRenderKit {
    const _renderConditional = renderConditional ? renderConditional : optionsOrRenderConditional as RenderFunction
    const options = renderConditional ? optionsOrRenderConditional as ConditionalOptions : { type: 'create/destroy' as const, setup: undefined };
    if (options.type === 'show/hide') {
        return ElseShowIf($condition, _renderConditional, options)
    }
    return new ConditionalRenderKit(
        'elseIf',
        wrapToNormalize(_renderConditional),
        'create',
        getContext(),
        { $condition, setup: options.setup }
    )
}


export function Else(renderConditional: RenderFunction | NodeEntity | NodeEntity[]): ConditionalRenderKit
export function Else<OPT extends ConditionalOptions>(options: OPT, renderConditional: RenderConditional<OPT>): ConditionalRenderKit
export function Else<OPT extends ConditionalOptions>(optionsOrRenderConditional: NodeEntity | NodeEntity[] | RenderFunction | OPT, renderConditional?: RenderConditional<OPT>): ConditionalRenderKit {
    const _renderConditional = renderConditional ? renderConditional : optionsOrRenderConditional as RenderFunction
    const options = renderConditional ? optionsOrRenderConditional as ConditionalOptions : { type: 'create/destroy' as const, setup: undefined };
    if (options.type === 'show/hide') {
        return ElseShow(_renderConditional, options)
    }
    return new ConditionalRenderKit(
        'else',
        wrapToNormalize(_renderConditional),
        'create',
        getContext(),
    )
}

// export function MountIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit {
//     resetCurrentNodePodIndex()
//     return new ConditionalRenderKit(
//         'if',
//         wrapToPreserve(renderConditional),
//         'mount',
//         getContext(),
//         { $condition }
//     )
// }

// export function ElseMountIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction) {
//     return new ConditionalRenderKit(
//         'elseIf',
//         wrapToPreserve(renderConditional),
//         'mount',
//         getContext(),
//         { $condition }
//     )
// }

// export function ElseMount(renderConditional: RenderFunction) {
//     return new ConditionalRenderKit(
//         'else',
//         wrapToPreserve(renderConditional),
//         'mount',
//         getContext(),
//     )
// }

export function ShowIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction, options: ConditionalOptions): ConditionalRenderKit {
    resetCurrentNodePodIndex(0)
    return new ConditionalRenderKit(
        'if',
        wrapToNormalize(renderConditional),
        'show',
        getContext(),
        { $condition, setup: options.setup }
    )
}

export function ElseShowIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction, options: ConditionalOptions) {
    if (currentNodePodIndex === undefined)
        currentNodePodIndex = 0;
    else currentNodePodIndex++;
    return new ConditionalRenderKit(
        'elseIf',
        wrapToNormalize(renderConditional),
        'show',
        getContext(),
        { nodePodIndex: currentNodePodIndex, $condition, setup: options.setup }
    )
}

export function ElseShow(renderConditional: RenderFunction, options: ConditionalOptions) {
    if (currentNodePodIndex === undefined)
        currentNodePodIndex = 0;
    else currentNodePodIndex++;
    return new ConditionalRenderKit(
        'else',
        wrapToNormalize(renderConditional),
        'show',
        getContext(),
        { nodePodIndex: currentNodePodIndex, setup: options.setup }
    )
}

// function _if($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction, statementType: 'if' | 'elseIf' = 'if', type: 'create' | 'show' | 'mount' = currentRenderType) {
//     const _renderConditional = type === 'mount' ? wrapToPreserve(renderConditional) : wrapToNormalize(renderConditional)
//     return new ConditionalRenderKit(statementType, _renderConditional, type, $condition)
// }

// export function ElseIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction) {
//     return _if($condition, renderConditional, 'elseIf')
// }

// export function Else(renderConditional: RenderFunction) {
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


import { _NodePod } from "../node/NodePod";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { AnyObject, Booleanny } from "@rue/types";
import { ReactiveGet } from "../../../quarky/src";
import { getContext } from "../context/context-stack";
import { getPhasicNode } from "../transition/PhaseChange";
import { Context, createNodeContext } from "../context/Context";
import { useTransitionNodes } from "../transition/I-O";





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
    const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
    return new ConditionalRenderKit(
        'if',
        wrapWithContext(_renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
        'create',
        getContext(),
        transitionNodes,
        { $condition, setup: options.setup, phasicNode: getPhasicNode() }
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
    const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
    return new ConditionalRenderKit(
        'elseIf',
        wrapWithContext(_renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
        'create',
        getContext(),
        transitionNodes,
        { $condition, setup: options.setup, phasicNode: getPhasicNode() }
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
    const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
    return new ConditionalRenderKit(
        'else',
        wrapWithContext(_renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
        'create',
        getContext(),
        transitionNodes,
        { setup: options.setup, phasicNode: getPhasicNode() }
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
    const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
    return new ConditionalRenderKit(
        'if',
        wrapWithContext(renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
        'show',
        getContext(),
        transitionNodes,
        { $condition, setup: options.setup, phasicNode: getPhasicNode() }
    )
}

export function ElseShowIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction, options: ConditionalOptions) {
    if (currentNodePodIndex === undefined)
        currentNodePodIndex = 0;
    else currentNodePodIndex++;
    const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()

    return new ConditionalRenderKit(
        'elseIf',
        wrapWithContext(renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
        'show',
        getContext(),
        transitionNodes,
        { nodePodIndex: currentNodePodIndex, $condition, setup: options.setup, phasicNode: getPhasicNode() }
    )
}

export function ElseShow(renderConditional: RenderFunction, options: ConditionalOptions) {
    if (currentNodePodIndex === undefined)
        currentNodePodIndex = 0;
    else currentNodePodIndex++;
    const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()

    return new ConditionalRenderKit(
        'else',
        wrapWithContext(renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
        'show',
        getContext(),
        transitionNodes,
        { nodePodIndex: currentNodePodIndex, setup: options.setup, phasicNode: getPhasicNode() }
    )
}

// function _if($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction, statementType: 'if' | 'elseIf' = 'if', type: 'create' | 'show' | 'mount' = currentRenderType) {
//     const _renderConditional = type === 'mount' ? wrapToPreserve(renderConditional) : wrapWithContext(renderConditional)
//     return new ConditionalRenderKit(statementType, _renderConditional, type, $condition)
// }

// export function ElseIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction) {
//     return _if($condition, renderConditional, 'elseIf')
// }

// export function Else(renderConditional: RenderFunction) {
//     const type = currentRenderType;
//     const _renderConditional = type === 'mount' ? wrapToPreserve(renderConditional) : wrapWithContext(renderConditional)
//     return new ConditionalRenderKit('else', _renderConditional, currentRenderType)
// }








function wrapWithContext(renderConditional: RenderFunction, context: AnyObject) {

    return () => normalizeToArray(
        createNodeContext(Context, renderConditional, {
            with: context
        })
    )
}







// function validateConditionalStatements(statements: ConditionalRenderKit[]) {

// }


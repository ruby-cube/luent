import { _NodePod } from "../node/NodePod";
import { NodeEntity, normalizeToRenderFunction, RenderFunction } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { AnyObject, Booleanny } from "@rue/types";
import { ReactiveGet } from "../../../quarky/src";
import { getContext, getCurrentContext, popContext, pushContext } from "../context/context-stack";
// import { getPhasicNode } from "../transition/PhasicNode";
import { createNodeContext } from "../context/Context";
import { useTransitionNodes } from "../transition/TransitNode";
import { NodeKit, setUpNodeEntities } from "../node/setUpNodeEntities";

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



type ActivationType = 'show' | 'create' | 'mount'


export function $if($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function $if($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function $if($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity): ConditionalRenderKit {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional)
   const activationType = renderConditional ? typeOrRenderConditional as ActivationType : 'create' as const
   if (activationType === 'show') {
      return ShowIf($condition, _renderConditional)
   }
   const _wrapWithContext = activationType === 'mount' ? wrapToPreserve : wrapWithContext

   resetCurrentNodePodIndex()
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   console.log('context?', getCurrentContext())
   return new ConditionalRenderKit(
      'if',
      _wrapWithContext(_renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
      activationType,
      // 'create',
      transitionNodes,
      { $condition, context: getContext() }
   )
}


export function $elseif($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function $elseif($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function $elseif($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity): ConditionalRenderKit {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional)
   const activationType = renderConditional ? typeOrRenderConditional as ActivationType : 'create';
   if (activationType === 'show') {
      return ElseShowIf($condition, _renderConditional)
   }
   const _wrapWithContext = activationType === 'mount' ? wrapToPreserve : wrapWithContext
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return new ConditionalRenderKit(
      'elseIf',
      _wrapWithContext(_renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
      activationType,
      // 'create',
      transitionNodes,
      { $condition }
   )
}




export function $else(renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function $else(activationType: ActivationType, renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function $else(typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity): ConditionalRenderKit {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional)
   const activationType = renderConditional ? typeOrRenderConditional as ActivationType : 'create';
   if (activationType === 'show') {
      return ElseShow(_renderConditional)
   }
   const _wrapWithContext = activationType === 'mount' ? wrapToPreserve : wrapWithContext
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return new ConditionalRenderKit(
      'else',
      _wrapWithContext(_renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
      // 'create',
      activationType,
      transitionNodes,
   )
}

// export function MountIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit {
//     resetCurrentNodePodIndex()
//     return new ConditionalRenderKit(
//         'if',
//         wrapToPreserve(renderConditional, context),
//         'mount',
//         getContext(),
//         { $condition }
//     )
// }

// export function ElseMountIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction, options: ConditionalOptions) {
//     const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
//     return new ConditionalRenderKit(
//         'elseIf',
//         wrapToPreserve(renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
//         'mount',
//         getContext(),
//         transitionNodes,
//         { $condition, setup: options.setup, phasicNode: getPhasicNode() }
//     )
// }

// export function ElseMount(renderConditional: RenderFunction, options: ConditionalOptions) {
//     const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
//     return new ConditionalRenderKit(
//         'else',
//         wrapToPreserve(renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
//         'mount',
//         getContext(),
//         transitionNodes,
//         { setup: options.setup, phasicNode: getPhasicNode() }
//     )
// }

export function ShowIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction): ConditionalRenderKit {
   resetCurrentNodePodIndex(0)
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return new ConditionalRenderKit(
      'if',
      wrapWithContext(renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
      'show',
      transitionNodes,
      { $condition, context: getContext() }
   )
}

export function ElseShowIf($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction) {
   if (currentNodePodIndex === undefined)
      currentNodePodIndex = 0;
   else currentNodePodIndex++;
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()

   return new ConditionalRenderKit(
      'elseIf',
      wrapWithContext(renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
      'show',
      transitionNodes,
      { nodePodIndex: currentNodePodIndex, $condition }
   )
}

export function ElseShow(renderConditional: RenderFunction) {
   if (currentNodePodIndex === undefined)
      currentNodePodIndex = 0;
   else currentNodePodIndex++;
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()

   return new ConditionalRenderKit(
      'else',
      wrapWithContext(renderConditional, { [REGISTER_TRANSITION_NODE]: registerTransitionNode }),
      'show',
      transitionNodes,
      { nodePodIndex: currentNodePodIndex }
   )
}

// function _if($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction, statementType: 'if' | 'elseIf' = 'if', type: 'create' | 'show' | 'mount' = currentRenderType) {
//     const _renderConditional = type === 'mount' ? wrapToPreserve(renderConditional) : wrapWithContext(renderConditional)
//     return new ConditionalRenderKit(statementType, _renderConditional, type, $condition)
// }

// export function $elseif($condition: ReactiveGet<Booleanny>, renderConditional: RenderFunction) {
//     return _if($condition, renderConditional, 'elseIf')
// }

// export function $else(renderConditional: RenderFunction) {
//     const type = currentRenderType;
//     const _renderConditional = type === 'mount' ? wrapToPreserve(renderConditional) : wrapWithContext(renderConditional)
//     return new ConditionalRenderKit('else', _renderConditional, currentRenderType)
// }


function wrapWithContext(renderConditional: RenderFunction, context: AnyObject) {
   const outerContext = getContext();
   return (parent: Element, nodePod: _NodePod, initialRender: boolean = false) => {
      try {
         if (!initialRender) pushContext(outerContext)
         const nodeEntities = setUpNodeEntities(normalizeToArray(
            createNodeContext(renderConditional, {
               with: context
            })
         ), parent, nodePod)
         return nodeEntities;
      }
      catch (err) {
         console.error(err)
         throw new Error('')
      }
      finally {
         if (!initialRender) popContext()
      }
   }
}

function wrapToPreserve(renderConditional: RenderFunction, context: AnyObject) {
   const outerContext = getContext();
   let nodeEntities: NodeKit[];
   return (parent: Element, nodePod: _NodePod, initialRender: boolean = false) => {
      if (nodeEntities) return nodeEntities;
      try {
         if (!initialRender) pushContext(outerContext)
         nodeEntities = setUpNodeEntities(normalizeToArray(
            createNodeContext(renderConditional, {
               with: context
            })), parent, nodePod)
         return nodeEntities;
      }
      catch (err) {
         console.error(err)
         throw new Error('')
      }
      finally {
         if (!initialRender) popContext()
      }
   }
}






// function validateConditionalStatements(statements: ConditionalRenderKit[]) {

// }


import { NodeEntity, normalizeToRenderFunction, RenderFunction } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { AnyObject, Booleanny } from "@rue/types";
import { Commons, getCommons } from "../commons/commons-stack";
// import { getPhasicNode } from "../transition/PhasicNode";
import { createCommons } from "../commons/Commons";
import { useTransitionNodes } from "../transition/TransitNode";
import { NodeKit, setUpNodeEntities } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { CommonsEntryKey } from "../commons/CommonsKey";

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



type ActivationType = 'show' | 'create' | 'mount'


export function If($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function If($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function If($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity): ConditionalRenderKit {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional)
   const activationType = renderConditional ? typeOrRenderConditional as ActivationType : undefined

   resetCurrentNodePodIndex()
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return new ConditionalRenderKit(
      'if',
      wrapWithCommons(_renderConditional, [REGISTER_TRANSITION_NODE(registerTransitionNode)], getCommons()),
      activationType,
      transitionNodes,
      { $condition }
   )
}


export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity): ConditionalRenderKit {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional)
   const activationType = renderConditional ? typeOrRenderConditional as ActivationType : undefined;

   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return new ConditionalRenderKit(
      'elseIf',
      wrapWithCommons(_renderConditional, [REGISTER_TRANSITION_NODE(registerTransitionNode)], getCommons()),
      activationType,
      transitionNodes,
      { $condition }
   )
}


export function Else(renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function Else(activationType: ActivationType, renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function Else(typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity): ConditionalRenderKit {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional)
   const activationType = renderConditional ? typeOrRenderConditional as ActivationType : undefined;

   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return new ConditionalRenderKit(
      'else',
      wrapWithCommons(_renderConditional, [REGISTER_TRANSITION_NODE(registerTransitionNode)], getCommons()),
      activationType,
      transitionNodes,
   )
}


//TODO: wrap with asyncContext instead of pushing commons?
function wrapWithCommons(renderConditional: RenderFunction, provide: [CommonsEntryKey, unknown][], outerCommons: Commons) {
   return (parent: Element, nodePod: NodePod) => {
      // try {
      //    pushCommons(outerCommons)
         const nodeEntities = setUpNodeEntities(normalizeToArray(  
            createCommons(renderConditional, {
               provide
            })), parent, nodePod)
         return nodeEntities;
      // }
      // finally {
      //    popCommons()
      // }
   }
}






// function validateConditionalStatements(statements: ConditionalRenderKit[]) {

// }


import { getGroupActivationType, NodeEntity, normalizeToRenderFunction, RenderFunction, withGroupActivationReset } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { Booleanny } from "@rue/types";
import { Provided, wrapWithCommons } from "../commons/Commons";
import { useTransitionNodes } from "../transition/TransitNode";
import { setUpNodeEntities } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { getClosestCommons } from "../commons/commons-stack";
import { Ion } from "@rue/quarky";
import { ConditionalRenderSeries } from "./ConditionalRenderSeries";

let currentNodePodIndex: number | undefined = undefined
function resetCurrentNodePodIndex(index?: number) {
   currentNodePodIndex = index ?? undefined;
}

export type ActivationType = 'show' | 'create' | 'mount'


export function If($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function If($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function If($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity): ConditionalRenderKit {
   const [render, activationType] = getParams(typeOrRenderConditional, renderConditional)
   resetCurrentNodePodIndex()
   return createConditionalKit('if', activationType, render, $condition)
}


export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity): ConditionalRenderKit {
   const [render, activationType] = getParams(typeOrRenderConditional, renderConditional)
   return createConditionalKit('elseIf', activationType, render, $condition)
}


export function Else(renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function Else(activationType: ActivationType, renderConditional: RenderFunction | NodeEntity): ConditionalRenderKit
export function Else(typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity): ConditionalRenderKit {
   const [render, activationType] = getParams(typeOrRenderConditional, renderConditional)
   return createConditionalKit('else', activationType, render)
}

function getParams(typeOrRenderConditional: NodeEntity | RenderFunction | ActivationType, renderConditional?: RenderFunction | NodeEntity) {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional)
   const activationType = renderConditional ? typeOrRenderConditional as ActivationType : undefined;
   return [_renderConditional, activationType] as const
}

function createConditionalKit(statementType: "if" | "elseIf" | "else", activationType: ActivationType | undefined, render: RenderFunction, $condition?: Ion<Booleanny> | Booleanny) {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return new ConditionalRenderKit(
      statementType,
      renderWithCommons(render, [REGISTER_TRANSITION_NODE(registerTransitionNode)]),
      activationType,
      transitionNodes,
       { $condition }
   )
}


function renderWithCommons(renderConditional: RenderFunction, provide: Provided) {
   const parentCommons = getClosestCommons()
   if (!parentCommons) throw new Error('commons missing')
   return (parent: Element, nodePod: NodePod) =>
      setUpNodeEntities(normalizeToArray(wrapWithCommons(provide, () => withGroupActivationReset(renderConditional), parentCommons)), parent, nodePod)
}

function $$series(...args: unknown[]){
   if (args[0] instanceof ConditionalRenderKit){
      return new ConditionalRenderSeries(args as ConditionalRenderKit[], getGroupActivationType())
   }
   //TODO: match case, try catch
   return;
}

//@ts-expect-error
window.$$series = $$series
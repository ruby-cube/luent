import { getGroupActivationType, JSXNode, normalizeToRenderFunction, RawJSXNode, RenderFunction, withGroupActivationReset } from "../node/makeNode";
import { isFunction, normalizeToArray } from "@rue/utils";
import { Booleanny } from "@rue/types";
import { Provided, wrapWithCommons } from "../commons/Commons";
import { useTransitionNodes } from "../transition/TransitNode";
import { NodeEntity, setUpNodeEntities } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { getClosestCommons } from "../commons/commons-stack";
import { Ion, isInertIon, isIon, toValue } from "@rue/quarky";
import { ConditionalKit, ConditionalRenderSeries } from "./ConditionalRenderSeries";
import { Flask } from "@rue/flask";
import { TransitionNode } from "../transition/TransitionNode";
import { MaybeIon } from "../component/Input";
import { createTryCatch } from "../boundaries/Try";

// let currentNodePodIndex: number | undefined = undefined

// function resetCurrentNodePodIndex(index?: number) {
//    currentNodePodIndex = index ?? undefined;
// }

export type ActivationType = 'show' | 'create' | 'mount'


export function If($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderFunction | JSXNode): ConditionalKit
export function If($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderFunction | JSXNode): ConditionalKit
export function If($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: JSXNode | RenderFunction | ActivationType, renderConditional?: RenderFunction | JSXNode): ConditionalKit {
   const [render, activationType] = getParams(typeOrRenderConditional, renderConditional)
   // resetCurrentNodePodIndex()
   return createConditionalKit('if', activationType, render, $condition)
}


export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderFunction | JSXNode): ConditionalKit
export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderFunction | JSXNode): ConditionalKit
export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: JSXNode | RenderFunction | ActivationType, renderConditional?: RenderFunction | JSXNode): ConditionalKit {
   const [render, activationType] = getParams(typeOrRenderConditional, renderConditional)
   return createConditionalKit('elseIf', activationType, render, $condition)
}


export function Else(renderConditional: RenderFunction | JSXNode): ConditionalKit
export function Else(activationType: ActivationType, renderConditional: RenderFunction | JSXNode): ConditionalKit
export function Else(typeOrRenderConditional: JSXNode | RenderFunction | ActivationType, renderConditional?: RenderFunction | JSXNode): ConditionalKit {
   const [render, activationType] = getParams(typeOrRenderConditional, renderConditional)
   return createConditionalKit('else', activationType, render)
}

function getParams(typeOrRenderConditional: JSXNode | RenderFunction | ActivationType, renderConditional?: RenderFunction | JSXNode) {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional)
   const activationType = renderConditional ? typeOrRenderConditional as ActivationType : undefined;
   return [_renderConditional, activationType] as const
}

export function createConditionalKit(statementType: "if" | "elseIf" | "else", activationType: ActivationType | undefined, render: RenderFunction, $condition?: Ion<Booleanny> | Booleanny) {

   return {
      statementType: statementType as 'if' | 'elseIf' | 'else',
      renderConditional: render,
      type: activationType,
      $condition
   }
}

export function createIfSeries(kits: ConditionalKit[]) {
   const condition = kits[0].$condition
   if (!isIon(condition) || isInertIon(condition)) return renderStaticConditional(kits)
   return new ConditionalRenderSeries(kits, getGroupActivationType())
}


//@ts-expect-error
window._$$IfSeries = createIfSeries


function renderStaticConditional(statements: ConditionalKit[]) {
   for (const kit of statements) {
      if (!!toValue(kit.$condition) === true) {
         return kit.renderConditional()
      }
   }
   return undefined;
}
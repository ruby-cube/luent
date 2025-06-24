import { getGroupActivationType, JSXNode, normalizeToRenderFunction, RawJSXNode, RenderFunction, withGroupActivationReset } from "../node/makeNode";
import { isFunction, normalizeToArray } from "@rue/utils";
import { Booleanny } from "@rue/types";
import { Provided, wrapWithCommons } from "../commons/Commons";
import { useTransitionNodes } from "../transition/TransitNode";
import { NodeEntity, setUpNodeEntities } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { getClosestCommons } from "../commons/commons-stack";
import { Ion, isIon } from "@rue/quarky";
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



function $$series(...args: unknown[]) {
   if (isConditionalSeries(args)) {
      if (!isIon(args[0].$condition)) return renderStaticConditional(args)
      return new ConditionalRenderSeries(args, getGroupActivationType())
   }
   if (isTryCatch(args)) {
      return createTryCatch(args)
   }
   return;
}

function isConditionalSeries(args: unknown[]): args is ConditionalKit[] {
   const arg = args[0]
   return arg instanceof Object && '$condition' in arg
}

function isTryCatch(args: unknown[]): args is [RenderFunction, undefined | ((err: Error) => RawJSXNode)] {
   return args.length < 3 && isFunction(args[0]) && args[0].length === 0;

}



//@ts-expect-error
window.$$series = $$series


function renderStaticConditional(statements: ConditionalKit[]) {
   for (const kit of statements) {
      if (!!kit.$condition === true) {
         return kit.renderConditional()
      }
   }
   return undefined;
}
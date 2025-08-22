import { getGroupActivationType, RawJSXNode, normalizeToRenderFunction, RenderFunction, withGroupActivationReset } from "../node/makeNode";
import { Booleanny } from "@rue/types";
import { Ion, isInertIon, isIon, toValue } from "@rue/quarky";
import { ConditionalKit, ConditionalRenderSeries } from "./ConditionalRenderSeries";

// let currentNodePodIndex: number | undefined = undefined

// function resetCurrentNodePodIndex(index?: number) {
//    currentNodePodIndex = index ?? undefined;
// }

export type ActivationType = 'show' | 'create' | 'remount'

type RenderConditional = (v: <T>(value: T) => NonNullable<T extends Ion<infer V> ? Ion<NonNullable<V>>:T>) => RawJSXNode


export function If($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderConditional | RawJSXNode): ConditionalKit
export function If($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderConditional | RawJSXNode): ConditionalKit
export function If($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: RenderConditional | RawJSXNode | ActivationType, renderConditional?: RenderFunction | RawJSXNode): ConditionalKit {
   const [render, activationType] = getParams(typeOrRenderConditional, renderConditional)
   // resetCurrentNodePodIndex()
   return createConditionalKit('if', activationType, render, $condition)
}


export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), renderConditional: RenderConditional | RawJSXNode): ConditionalKit
export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), activationType: ActivationType, renderConditional: RenderConditional | RawJSXNode): ConditionalKit
export function ElseIf($condition: Booleanny | ((_?: any) => Booleanny), typeOrRenderConditional: RawJSXNode | RenderConditional | ActivationType, renderConditional?: RenderFunction | RawJSXNode): ConditionalKit {
   const [render, activationType] = getParams(typeOrRenderConditional, renderConditional)
   return createConditionalKit('elseIf', activationType, render, $condition)
}


export function Else(renderConditional: RenderConditional | RawJSXNode): ConditionalKit
export function Else(activationType: ActivationType, renderConditional: RenderConditional | RawJSXNode): ConditionalKit
export function Else(typeOrRenderConditional: RawJSXNode | RenderConditional | ActivationType, renderConditional?: RenderConditional | RawJSXNode): ConditionalKit {
   const [render, activationType] = getParams(typeOrRenderConditional, renderConditional)
   return createConditionalKit('else', activationType, render)
}

function getParams(typeOrRenderConditional: RawJSXNode | RenderFunction | ActivationType, renderConditional?: RenderFunction | RawJSXNode) {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional!)
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
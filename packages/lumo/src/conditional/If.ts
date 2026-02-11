import { getGroupActivationType, RawJSXNode, normalizeToRenderFunction, RenderFunction, resetGroupActivationType, GroupActivationType } from "../node/makeJSXNode";
import { Booleanny } from "@rue/types";
import { getAwaiting, Ion, isGetter, isInertIon, isIon, toValue } from "@rue/quarky";
import { ConditionalKit, IfElseKit, renderShowHideSeries, toDynamicConditionalKits } from "./IfElse";
import { getFlask } from "@rue/flask";
import { isFunction } from "@rue/utils";
import { aC } from "vitest/dist/chunks/reporters.d.BFLkQcL6";

// let currentNodePodIndex: number | undefined = undefined

// function resetCurrentNodePodIndex(index?: number) {
//    currentNodePodIndex = index ?? undefined;
// }

export type ActivationType = 'create' | 'remount'

export type RenderConditional<T = undefined> = (/* v: NonNullable<T extends Ion<infer V> ? Ion<NonNullable<V>> : T> */view: { discard(changeCondition?: () => void): void }) => RawJSXNode

export function As<T>(value: T): asserts value is Exclude<T, null> {

}

// if (!isActivationKit(jsx)) {
//    if (__DEV__) console.error('compiler failed to tranform last argument to activation kit')
//    return createConditionalKit('if', 'create', () => jsx, $condition)
// }

// const { activationType, discard, render } = jsx
// TODO: manage both activation type and pending
export function If<T extends Booleanny | ((_?: any) => Booleanny)>($condition: T, jsx: RenderConditional<T> | RawJSXNode): ConditionalKit
export function If<T extends Booleanny | ((_?: any) => Booleanny)>($condition: T, pending: (() => Promise<any> | null), renderConditional: RenderConditional<T> | RawJSXNode): ConditionalKit
export function If<T extends Booleanny | ((_?: any) => Booleanny)>($condition: T, activationType: ActivationType, renderConditional: RenderConditional<T> | RawJSXNode): ConditionalKit
export function If<T extends Booleanny | ((_?: any) => Booleanny)>($condition: T, typeOrRenderConditional: RenderConditional<T> | RawJSXNode | ActivationType | (() => Promise<any> | null), renderConditional?: RenderConditional<T> | RawJSXNode): ConditionalKit {
   const [render, type, pending] = getParams(typeOrRenderConditional, renderConditional)
   return {
      statementType: 'if',
      render,
      type,
      pending: getAwaiting(),
      // pending,
      $condition
   }
}




export function ElseIf<T extends Booleanny | ((_?: any) => Booleanny)>($condition: T, jsx: RenderConditional<T> | RawJSXNode): ConditionalKit
export function ElseIf<T extends Booleanny | ((_?: any) => Booleanny)>($condition: T, activationType: ActivationType, renderConditional: RenderConditional<T> | RawJSXNode): ConditionalKit
export function ElseIf<T extends Booleanny | ((_?: any) => Booleanny)>($condition: T, typeOrRenderConditional: RawJSXNode | RenderConditional<T> | ActivationType, renderConditional?: RenderConditional | RawJSXNode): ConditionalKit {
   const [render, type, pending] = getParams(typeOrRenderConditional, renderConditional)
   // if (!isActivationKit(jsx)) {
   //    if (__DEV__) console.error('compiler failed to tranform last argument to activation kit')
   //    return createConditionalKit('elseIf', 'create', () => jsx, $condition)
   // }

   // const { activationType, discard, render } = jsx
   return {
      statementType: 'elseIf',
      render,
      type,
      pending: getAwaiting(),
      //   pending,
      $condition
   }
}


export function Else(jsx: RenderConditional | RawJSXNode): ConditionalKit
export function Else(activationType: ActivationType, renderConditional: RenderConditional | RawJSXNode): ConditionalKit
export function Else(typeOrRenderConditional: RawJSXNode | RenderConditional | ActivationType, renderConditional?: RenderConditional | RawJSXNode): ConditionalKit {
   const [render, type, pending] = getParams(typeOrRenderConditional, renderConditional)
   // if (!isActivationKit(jsx)) {
   //    if (__DEV__) console.error('compiler failed to tranform last argument to activation kit')
   //    return createConditionalKit('else', 'create', () => jsx)
   // }

   // const { activationType, discard, render } = jsx
   return {
      statementType: 'else',
      render,
      type,
      pending: getAwaiting(),
      //   pending,
      $condition: undefined
   }
}

function getParams(typeOrRenderConditional: RawJSXNode | RenderConditional | ActivationType | (() => Promise<any> | null), renderConditional?: RenderConditional | RawJSXNode) {
   const _renderConditional = normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional!)
   const activationType = renderConditional ? typeof typeOrRenderConditional === "string" ? typeOrRenderConditional as ActivationType : undefined : undefined;
   const pending = renderConditional ? isFunction(typeOrRenderConditional) ? typeOrRenderConditional : undefined : undefined;
   return [_renderConditional, activationType, pending] as const
}

// export function createConditionalKit(
//    statementType: "if" | "elseIf" | "else",
//    activationType: ActivationType | undefined,
//    render: RenderConditional,
//    $condition?: Ion<Booleanny> | Booleanny,
//    discard?: (() => void) | undefined
// ): ConditionalKit {

//    return {
//       statementType: statementType as 'if' | 'elseIf' | 'else',
//       render: render as RenderFunction,
//       type: activationType,
//       // discard,
//       $condition
//    }
// }

export function createIfSeries(kits: ConditionalKit[], viewBy?: GroupActivationType) {
   const condition = kits[0].$condition
   if (!isGetter(condition) || isInertIon(condition)) return renderStaticConditional(kits)
   const activationType = viewBy ?? getGroupActivationType()
   resetGroupActivationType()
   if (activationType === 'show') {
      return renderShowHideSeries(kits)
   }
   if (kits.at(-1)?.statementType !== 'else') kits.push(Else(() => undefined))
   const dynamicKits = toDynamicConditionalKits(kits, activationType)
   return new IfElseKit(dynamicKits, getFlask())
}


//@ts-expect-error
window._$$IfSeries = createIfSeries


export function renderStaticConditional(statements: ConditionalKit[]) {
   for (const kit of statements) {
      if (!!toValue(kit.$condition) === true) {
         return kit.render()
      }
   }
   return undefined;
}
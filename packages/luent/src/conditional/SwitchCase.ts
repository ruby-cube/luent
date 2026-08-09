import {createMemoizedDerivation, getAwaiting, Ion, isGetter, isInertIon, toValue } from "@luent/quarky";
import { GroupActivationType, RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { ConditionalKit } from "./IfElse";
import { ViewType, createIfSeries, RenderConditional } from "./If";
import { isFunction } from "@luent/utils";
import { FromTag, RenderSlot } from "../component/bindings-types";
import { DEFAULT } from "./MatchCase";


type SwitchCaseKit = {
   target: any,
   matches: (target: any, _case: any) => boolean
   cases: CasesKit[]
}

type CasesKit = {
   cases: any[],
   render: (() => RawJSXNode) | undefined
   type?: ViewType | undefined
}

type RawCaseKit = {
   case: any,
   render?: () => RawJSXNode
   type?: ViewType | undefined
}

type RawOutput = RawCaseKit | RawCaseKit[] | RawJSXNode[]

export function Switch(input: {
   x: Ion<any>, // TODO: change to key ... but need to make sure JSX plays well with it
   'view'?: GroupActivationType
   matches?: (target: any, _case: any) => boolean,
   Slot: RenderSlot
}) {
   const { $x, matches = (x: any, c: any) => x === c, Slot, "view": view } = input
   const kits = toConditionalKits({
      target: $x,
      cases: toCases(Slot() as RawCaseKit[]) as CasesKit[],
      matches
   })
   return (
      createIfSeries(kits, view)
   )
}

function toCases(raw: RawCaseKit[]): CasesKit[] {
   const kits: CasesKit[] = []
   for (const kit of raw) {
      const { case: c, render, type } = kit
      const prevKit = kits.at(-1)
      if (prevKit && !prevKit.render) {
         prevKit.cases.push(c)
         if (render) {
            prevKit.render = render
            prevKit.type = type
         }
      }
      else {
         const kit = {
            cases: c === DEFAULT ? [] : [c],
            render,
            type
         }
         kits.push(kit)
      }
   }
   return kits
}


export function Case(c: any, typeOrRender?: ViewType | RenderConditional | RawJSXNode, renderCase?: RenderConditional | RawJSXNode) {
   const type = isFunction(typeOrRender) ? undefined : typeOrRender
   const render = isFunction(typeOrRender) ? typeOrRender : renderCase
   return {
      case: c,
      render,
      type
   }
}



export function Default(typeOrRender: ViewType | RenderConditional | RawJSXNode, renderCase?: RenderConditional | RawJSXNode) {
   const type = isFunction(typeOrRender) ? undefined : typeOrRender
   const render = isFunction(typeOrRender) ? typeOrRender : renderCase
   return {
      case: DEFAULT,
      render,
      type
   }
}


function toConditionalKits(kit: SwitchCaseKit): ConditionalKit[] {
   const { cases, target, matches } = kit
   const kits: ConditionalKit[] = []

   for (const kit of cases) {
      const { render, type, cases } = kit
      const defaultCase = cases.length === 0
      kits.push({
         statementType: kits.length === 0 ? 'if' : defaultCase ? 'else' : 'elseIf',
         render: render!,
         type: type,
         $condition: defaultCase ? undefined : cases.length === 1 ? createMemoizedDerivation(() => matches(toValue(target), toValue(cases[0]))) : toCondition(target, cases, matches),
         pending: getAwaiting()
      })
      if (defaultCase) break;
   }
   return kits
}

function toCondition(target: any, cases: any[], matches: (target: any, _case: any) => boolean) {
   return createMemoizedDerivation(() => {
      for (const _case of cases) {
         if (matches(toValue(target), toValue(_case)))
            return true;
      }
      return false;
   })
}

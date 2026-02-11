import { $_derivation, getAwaiting, Ion, isGetter, isInertIon, toValue } from "@rue/quarky";
import { GroupActivationType, RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { ConditionalKit } from "./IfElse";
import { ActivationType, createIfSeries, RenderConditional } from "./If";
import { isFunction } from "@rue/utils";
import { component } from "../component/Component";
import { FromTag, RenderSlot } from "../component/Input";
import { ListKit } from "../iteratives/ItemList";
import { IndexedListKit } from "../iteratives/IndexedList";


type SwitchCaseKit = {
   target: any,
   matches: (target: any, _case: any) => boolean
   cases: CasesKit[]
}

type CasesKit = {
   cases: any[],
   render: (() => RawJSXNode) | undefined
   type?: ActivationType | undefined
}

type RawCaseKit = {
   case: any,
   render?: () => RawJSXNode
   type?: ActivationType | undefined
}

type RawOutput = RawCaseKit | RawCaseKit[] | RawJSXNode[]

export function Switch(input: FromTag<{
   x: Ion<any>,
   'view'?: GroupActivationType
   matches?: (target: any, _case: any) => boolean,
   Slot: RenderSlot
}>) {
   const { $x, matches = (x: any, c: any) => x === c, Slot, "view": view } = input
   const kits = toConditionalKits({
      target: $x,
      cases: toCases(Slot() as RawOutput[]) as CasesKit[],
      matches
   })
   return component(
      createIfSeries(kits, view)
   )
}

function toCases(raw: RawOutput[]): CasesKit[] {
   console.log('raw', raw)
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
            cases: c === 'default' ? [] : [c],
            render,
            type
         }
         kits.push(kit)
      }
   }
   return kits
}


export function Case(c: any, typeOrRender?: ActivationType | RenderConditional | RawJSXNode, renderCase?: RenderConditional | RawJSXNode) {
   const type = isFunction(typeOrRender) ? undefined : typeOrRender
   const render = isFunction(typeOrRender) ? typeOrRender : renderCase
   return {
      case: c,
      render,
      type
   }
}

export function Default(typeOrRender: ActivationType | RenderConditional | RawJSXNode, renderCase?: RenderConditional | RawJSXNode) {
   const type = isFunction(typeOrRender) ? undefined : typeOrRender
   const render = isFunction(typeOrRender) ? typeOrRender : renderCase
   return {
      case: 'default',
      render,
      type
   }
}


function toConditionalKits(kit: SwitchCaseKit): ConditionalKit[] {
   const { cases, target, matches } = kit
   const kits: ConditionalKit[] = []

   for (const kit of cases) {
      const { render, type, cases } = kit
      console.log(cases[0], type)
      const defaultCase = cases.length === 0
      kits.push({
         statementType: kits.length === 0 ? 'if' : defaultCase ? 'else' : 'elseIf',
         render: render!,
         type: type,
         $condition: defaultCase ? undefined : cases.length === 1 ? $_derivation(() => matches(toValue(target), toValue(cases[0]))) : toCondition(target, cases, matches),
         pending: getAwaiting()
      })
      if (defaultCase) break;
   }
   return kits
}

function toCondition(target: any, cases: any[], matches: (target: any, _case: any) => boolean) {
   return $_derivation(() => {
      for (const _case of cases) {
         if (matches(toValue(target), toValue(_case)))
            return true;
      }
      return false;
   })
}

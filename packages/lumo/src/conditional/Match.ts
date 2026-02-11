import { getAwaiting, queueIonicPrelude, Suspense, toValue, watchToRender } from "@rue/quarky";
import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { JSXNode, processJSXOutput, toAsyncRender, VineNode } from "../node/VineNode";
import { DynamicNodeKit, IfElseKit } from "./IfElse";
import { ActivationType, RenderConditional } from "./If";
import { $_snap_context, ContextSnapshot, Flask, FLASK, getFlask } from "@rue/flask";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";

//    {Match($tab, openTabs, tab => (
//       <div view={tabViews}>
//          <Tab page={tabNames[tab]} count={$count} />
//       </div>
//    ))}
//    {Default(
//    )}



//    {Match($tab, tab => tab.id, (tab, view) => (
//       <div at:create={tabViews.set(tab, view)}>
//          <Tab page={tabNames[tab]} count={$count} />
//       </div>
//    ))}


type RenderCase = (key: any, view: View) => RawJSXNode;

type View = { discard: (arg: any) => void }

type RawMatchKit = {
   key: any;
   renderCase: (key: any, view: View) => RawJSXNode;
   type: ActivationType
}
export function Match(key: any, type: ActivationType, renderCase: (key: any, view: { discard: (arg: any) => void }) => RawJSXNode) {
   return {
      key,
      renderCase,
      type
   }
}

export function createMatchSeries(matchKit: RawMatchKit, defaultKit?: {
   case: string;
   render: RenderFunction;
   type: ActivationType;
} | undefined) {
   const { key, renderCase, type } = matchKit
   return new MatchKit(key, type, renderCase, getAwaiting(), defaultKit?.render, defaultKit?.type)
}


const DEFAULT = Symbol('default')
const CREATE = Symbol('default')


function createDynamicNodeKit(key: any, activationType: ActivationType | undefined, render: RenderCase, context: ContextSnapshot, pending: Suspense | undefined, asDefault=false): DynamicNodeKit {

   let _cache: JSXNode[] | undefined = undefined

   return {
      pending,
      nodes: null,
      flask: undefined,
      render: toAsyncRender( asDefault ? render : (view: View) => render(toValue(key), view) as RenderFunction, context, {
         [FLASK]: undefined,
         [TRACE]: __DEV__ ? __DEV__buildAsyncPath() ?? '' : ''
      }),
      type: activationType,
      get cache(): JSXNode[] | undefined {
         return _cache
      },
      set cache(nodes: JSXNode[]) {
         _cache = nodes
      },
      view: {
         discard(changeCondition?: () => void) {
            _cache = undefined
            changeCondition?.()
         }
      }
   }
}

type Case = any

class MatchKit extends VineNode {

   createKit(caseKey: any, type: ActivationType, render: RenderCase, context: ContextSnapshot, pending: Suspense | undefined) {
      const kit = createDynamicNodeKit(
         this.key,
         type,
         render,
         context,
         pending
      )
      this.kits.set(caseKey, kit)
      return kit
   }

   private kits: Map<Case, DynamicNodeKit> = new Map()

   toCaseKey(key: any) {
      const _caseKey = toValue(key)
      return _caseKey === undefined ? DEFAULT : this.type === 'create' ? CREATE : _caseKey
   }

   outerFlask: Flask = getFlask()
   constructor(
      private key: any,
      private type: ActivationType,
      render: RenderCase,
      pending: Suspense | undefined,
      renderDefault: RenderConditional = () => undefined,
      defaultType: ActivationType = 'create',
   ) {
      super()

      const context = $_snap_context()
      const caseKey = this.toCaseKey(key)

      const defaultKit = createDynamicNodeKit(this.key, defaultType, renderDefault, context, pending, true)
      this.kits.set(DEFAULT, defaultKit)

      const kit = this.kits.get(caseKey) ?? this.createKit(caseKey, type, render, context, pending)

      this.activateConditional(kit, (kit) => {
         kit.flask!.emitInitialMount()
      })

      watchToRender(key, ({ previous, flask }) => {
         const prevCase = this.toCaseKey(previous)
         const caseKey = this.toCaseKey(key)
         if (caseKey === prevCase) return;

         const kit = this.kits.get(caseKey) ?? this.createKit(caseKey, type, render, context, pending)
         const prevKit = this.kits.get(prevCase)!

         if (kit.pending) {
            this.awaitPendingConditional(kit.pending, kit, prevKit, flask)
         }
         else {
            this.switchConditional(kit, prevKit, flask)
         }
         if (type === 'create') {

         }
      })


   }

   awaitPendingConditional = IfElseKit.prototype.awaitPendingConditional
   switchConditional = IfElseKit.prototype.switchConditional
   activateConditional = IfElseKit.prototype.activateConditional
   deactivateConditional = IfElseKit.prototype.deactivateConditional
}
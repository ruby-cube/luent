import { getAwaiting, Ion, queueIonicPrelude, Suspense, toValue, watchToRender } from "@rue/quarky";
import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { JSXNode, processJSXOutput, toAsyncRender, VineNode } from "../node/VineNode";
import { IfElseKit } from "./IfElse";
import { ActivationType, RenderConditional } from "./If";
import { $_snap_context, ContextSnapshot, Flask, FLASK, getFlask } from "@rue/flask";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { DEFAULT, MatchKit, toCasesMap } from "./MatchCase";
import { isFunction } from "@rue/utils";

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

// <Match x={$tab} view='remount' toCase={key => 'tab'}>
//    {Case('tab', view =>
//       <div at:create={() => tabViews[$tab()] = view}>
//          <Tab page={tabNames[$tab()]} count={$count} />
//       </div>
//    )}
//    {Default(
//       <div>No tabs open</div>
//    )}
// </Match>



type RenderCase = (view: View) => RawJSXNode;

type View = { discard: () => void }

type RawAsKit = {
   key: any;
   case: any;
   render: (view: View) => RawJSXNode;
   type: ActivationType | undefined
}
export function As(key: Ion<any>, renderCase: RenderConditional | RawJSXNode): RawAsKit
export function As(key: Ion<any>, type: ActivationType, renderCase: RenderConditional | RawJSXNode): RawAsKit
export function As(key: Ion<any>, typeOrRender: ActivationType | RenderConditional | RawJSXNode, renderCase?: RenderConditional | RawJSXNode): RawAsKit {
   const type = isFunction(typeOrRender) ? undefined : typeOrRender as ActivationType
   const render = (isFunction(typeOrRender) ? typeOrRender : renderCase) as RenderConditional
   return {
      case: 'as',
      key,
      render,
      type
   }
}

export function createAsSeries(...series: [RawAsKit, {
   case: any;
   render: RenderFunction;
   type: ActivationType;
}]) {
   const [kit] = series
   return new MatchKit(kit.key, toCasesMap(series, undefined), (key) => key == null ? DEFAULT : 'as')
}

window._$$AsSeries = createAsSeries


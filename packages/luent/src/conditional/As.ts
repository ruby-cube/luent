import { getAwaiting, Ion, toValue, trackForRender } from "@rue/quarky";
import { getGroupActivationType, RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { JSXNode, processJSXOutput, toAsyncRender, VineNode } from "../node/VineNode";
import { IfElseKit } from "./IfElse";
import { ViewType, RenderConditional } from "./If";
import { $_snap_context, ContextSnapshot, Flask, FLASK, getFlask } from "@rue/flask";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { DEFAULT, MatchKit, renderStaticMatchCase, toCasesMap } from "./MatchCase";
import { isFunction } from "@rue/utils";

//    {Match($tab, openTabs, tab => (
//       <div view={tabViews}>
//          <Tab page={tabNames[tab]} count={$count} />
//       </div>
//    ))}
//    {Default(
//    )}



//    {Match($tab, tab => tab.id, (tab, view) => (
//       <div before:mount={tabViews.set(tab, view)}>
//          <Tab page={tabNames[tab]} count={$count} />
//       </div>
//    ))}

// <Match x={$tab} view='preserve' toCase={key => 'tab'}>
//    {Case('tab', view =>
//       <div before:mount={() => tabViews[$tab()] = view}>
//          <Tab page={tabNames[$tab()]} count={$count} />
//       </div>
//    )}
//    {Default(
//       <div>No tabs open</div>
//    )}
// </Match>



type RenderCase = (view: View) => RawJSXNode;

type View = { markDiscard: () => void }

type RawAsKit = {
  key: any;
  case: any;
  render: (view: View) => RawJSXNode;
  type: ViewType | undefined
}
export function As(key: Ion<any>, renderCase: RenderConditional | RawJSXNode): RawAsKit
export function As(key: Ion<any>, type: ViewType, renderCase: RenderConditional | RawJSXNode): RawAsKit
export function As(key: Ion<any>, typeOrRender: ViewType | RenderConditional | RawJSXNode, renderCase?: RenderConditional | RawJSXNode): RawAsKit {
  const type = isFunction(typeOrRender) ? undefined : typeOrRender as ViewType
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
  type: ViewType;
}]) {
  const [kit] = series
  if (import.meta.env.SSR) return renderStaticMatchCase(kit.key, toCasesMap(series, undefined), (key) => key == null ? DEFAULT : 'as')
  return new MatchKit(kit.key, toCasesMap(series, undefined), (key) => key == null ? DEFAULT : 'as')
}

//@ts-expect-error
globalThis._$$AsSeries = createAsSeries


import { cancelPromise, getAwaiting, Ion, SuspenseIon, toValue, trackForRender } from "@luently/quarky";
import { getGroupActivationType, RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { ViewType, RenderConditional } from "./If";
import { isFunction, noop } from "@luently/utils";
import { FromTag, RenderTag } from "../component/bindings-types";
// import { createCasesKit, DEFAULT, MatchKit } from "./Switch";
import { $_snap_context, ContextSnapshot, FLASK, Flask, getFlask } from "@luently/flask";
import { AsyncRender, JSXNode, toAsyncRender, VineNode } from "../node/VineNode";
import { DynamicNodeKit, IfElseKit } from "./IfElse";
import { __DEV__buildAsyncPath, TRACE } from "@luently/flask";
import { markInitialRender, unmarkInitialRender } from "../transitions/transitions";
import { component } from "../index";

type CaseKey = any

type RawCaseKit = {
  case: any,
  render?: (view: View) => RawJSXNode
  type?: ViewType | undefined
}

export type CasesKit = {
  // cases: any[]
} & DynamicNodeKit

type RawOutput = RawCaseKit | RawCaseKit[] | RawJSXNode[]

export function Match(setup: FromTag<{
  x: Ion<any>, // TODO: change to key ... but need to make sure JSX plays well with it
  'view'?: ViewType // TODO: allow 'show'?
  toCase?: (key: any) => any,
  Slot: RenderTag
}>) {
  const { $x, toCase = (key: any) => key, Slot, "view": view } = setup
  if (import.meta.env.SSR) return renderStaticMatchCase($x, toCasesMap(Slot() as RawCaseKit[], view), toCase)
  return new MatchKit($x, toCasesMap(Slot() as RawCaseKit[], view), toCase)
}


export function toCasesMap(raw: RawCaseKit[], groupActivationType: ViewType | undefined): Map<any, CasesKit> {
  const superGroupActivationType = getGroupActivationType()
  const fallbackType = groupActivationType ?? superGroupActivationType === 'show' ? 'preserve' : superGroupActivationType ?? 'create'
  const map: Map<any, CasesKit> = new Map()
  const context = $_snap_context()
  const pending = getAwaiting()
  let currentKit;
  for (const rawKit of raw) {
    const { case: c, render, type } = rawKit
    if (currentKit && !currentKit.render) {
      if (render) {
        currentKit.render = toAsyncRender(render as RenderFunction, context, {
          [FLASK]: undefined,
          [TRACE]: __DEV__ ? __DEV__buildAsyncPath() ?? '' : ''
        })
        currentKit.type = type ?? fallbackType
      }
    }
    else {
      currentKit = createCasesKit(type ?? fallbackType, render, context, pending)
    }
    map.set(c, currentKit)
    //@ts-expect-error
    if (currentKit.render)
      currentKit = undefined
  }
  return map
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
  const type = (isFunction(typeOrRender) ? undefined : typeOrRender) as ViewType
  const render = isFunction(typeOrRender) ? typeOrRender : renderCase as RenderConditional
  return {
    case: DEFAULT,
    render,
    type
  }
}




type RenderCase = (view: View) => RawJSXNode;

type View = { markDiscard: (arg: any) => void }



export const DEFAULT = Symbol('default')

export function createCasesKit(viewType: ViewType | undefined, render: RenderCase | undefined, context: ContextSnapshot, pending: SuspenseIon | undefined): CasesKit {

  return {
    pending,
    nodes: null,
    flask: undefined,
    render: render ? toAsyncRender(render as RenderFunction, context, {
      [FLASK]: undefined,
      [TRACE]: __DEV__ ? __DEV__buildAsyncPath() ?? '' : ''
    }) : undefined,
    type: viewType,
    cache: undefined,
    awaitCache: undefined,
    view: {
      markDiscard: noop
    }
  }
}

type Case = any

export function renderStaticMatchCase(
  $key: Ion<any>,
  cases: Map<Case, CasesKit>,
  toCase: (key: any) => any = (key: any) => key == null ? DEFAULT : key,
) {
  const caseKey = toCase($key())

  const kit = cases.get(caseKey) ?? cases.get(DEFAULT)
  if (kit) {
    return kit.render(getFlask(), kit.view) // TODO: remove kit.view as input?
  }
  return ""
}

export class MatchKit extends VineNode {

  getKit(caseKey: any, cacheKey: any) {
    const protoKit = this.cases.get(caseKey) ?? this.cases.get(DEFAULT)
    if (!protoKit) return;
    if (protoKit.type === 'create') return protoKit
    if (protoKit.type === 'preserve') {
      const cached = this.cached ?? (this.cached = new Map())
      return cached.get(cacheKey) ?? this.createCachedKit(cacheKey, protoKit)
    }
  }

  createCachedKit(cacheKey: any, protoKit: CasesKit) {
    let _cache: JSXNode[] | undefined;
    const kit = {
      ...protoKit, get cache(): JSXNode[] | undefined {
        return _cache
      },
      set cache(nodes: JSXNode[]) {
        _cache = nodes
      },
      view: {
        markDiscard() {
          _cache = undefined
        }
      }
    }
    this.cached!.set(cacheKey, kit)
    const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === "create" }))
    flask.onDiscard(() => {
      this.cached?.delete(cacheKey)
    })
    return kit
  }

  cached?: Map<any, CasesKit>

  outerFlask: Flask = getFlask()

  constructor(
    $key: Ion<any>,
    private cases: Map<Case, CasesKit>,
    toCase: (key: any) => any = (key: any) => key == null ? DEFAULT : key,
  ) {
    super()
    const caseKey = toCase($key())

    const kit = this.getKit(caseKey, $key())
    if (kit) {
      try {
        markInitialRender(true)
        this.activateConditional(kit, (kit) => {
          kit.flask!.emitInitialMount()
          if (kit.type == 'preserve')
            kit.flask!.onDiscard(() => {
              this.cached?.delete(caseKey)
            })
        })
      }
      finally {
        unmarkInitialRender()
      }
    }

    trackForRender($key, ({ previous, flask }) => {
      const prevCase = toCase(previous)
      const caseKey = toCase($key())
      const matchKey = $key()
      if (matchKey === previous) {
        return;
      }

      const kit = this.getKit(caseKey, matchKey)
      const prevKit = this.pendingDeactivatedKit ?? this.getKit(prevCase, previous)

      if (this.pendingSwitch) {
        this.cancelledPendingSwitch.add(this.pendingSwitch)
        this.pendingSwitch = null
      }

      if (kit.pending) {
        this.awaitPendingConditional(kit.pending, kit, prevKit)
      }
      else {
        this.deactivateConditional(prevKit)
        this.reactivateConditional(kit)
        if (kit.type == 'preserve')
          kit.flask!.onDiscard(() => {
            this.cached?.delete(matchKey)
          })
      }
    })
  }

  cancelledPendingSwitch = new Set()

  _pendingSwitchID = 0
  pendingSwitch: number | null = null;
  pendingDeactivatedKit: DynamicNodeKit | null = null

  awaitPendingConditional = IfElseKit.prototype.awaitPendingConditional
  reactivateConditional = IfElseKit.prototype.reactivateConditional
  activateConditional = IfElseKit.prototype.activateConditional
  deactivateConditional = IfElseKit.prototype.deactivateConditional
}
import { isFunction, normalizeToArray } from "@rue/utils";
import { Component, unnestComponent } from "../component/Component";
import { getViewFlask } from "../flask/ViewFlask";
import { JSXNode, RawJSXNode } from "../node/makeNode";
import { mountConditional } from "./ConditionalRenderSeries";
import { getClosestCommons, getCommons, popCommons, pushCommons } from "../commons/commons-stack";
import { Commons, NodeCommons, Provided, wrapWithCommons } from "../commons/Commons";
import { NodeEntity, setUpNodeEntities } from "../node/setUpNodeEntities";
import { DynamicPod, NodePod, removeDOMNodes } from "../node/NodePod";
import { $_run_with_, $_snap_context, FLASK, Flask } from "@rue/flask";
import { fromTag } from "../component/fromTag";
import { ion, Ion, isIon, MutableIon, toValue, watch } from "@rue/quarky";
import { useTransitionNodes } from "../transition/TransitNode";
import { TransitionNode } from "../transition/TransitionNode";
import { getPhasicNode } from "../transition/PhasicNode";
import { __DEV__buildAsyncPath } from "../../../flask/debug";
import { RenderTransient, toRenderTransient, wrapToPreserve } from "../dynamic/DynamicKit";



//TODO: 
// [] implement static polymorph
// [] implement dynamic finite polymorph
// [] implement dynamic infinite polymorph

type Morphable = MutableIon<string | [string, Object]> & {
   as(key: string, input?: Object): void;
   discard(): void
   discardOthers(): void
   discardAll(): void
}

const polymorphMap: Map<Morphable, PolymorphKit[]> = new Map();

function registerPolymorph($activeKey: Morphable, polymorph: PolymorphKit) {
   const polymorphs = polymorphMap.get($activeKey) ?? []
   polymorphs.push(polymorph)
   polymorphMap.set($activeKey, polymorphs)
}

type RenderFunction = (() => RawJSXNode) | ((input: Object) => RawJSXNode)

export function Polymorph(switchMap: { [key: string]: RenderFunction }) {

   function $Polymorph(input = fromTag<{
      as: Morphable | string,
      provide?: Provided
   }>()): Component {
      const { $as: $activeKey, provide } = input

      if (typeof $activeKey === 'string') {
         return {
            exposed: undefined,
            jsxNodes: normalizeToArray(provide ? Commons({ provide, Slot: switchMap[$activeKey] }) : unnestComponent(switchMap[$activeKey]()))
         }
      }

      const polymorphKit = new PolymorphKit(switchMap, $activeKey as Morphable)
      registerPolymorph($activeKey as Morphable, polymorphKit)

      return { exposed: undefined, jsxNodes: [polymorphKit] };
   }

   $Polymorph.morphable = function morphable(key: string, input?: Object): Morphable {

      return ion(input ? [key, input] : key, {
         as(key: string, input?: Object) {
            if (input) {
               if (Array.isArray(this.state) && this.state[0] === key && this.state[1] === input) return;
               this.state = [key, input]
               return;
            }
            if (this.state === key) return;
            this.state = key
            return;
         },
         discard(key: string, unique?: Object) {
            const polymorphs = polymorphMap.get(this as unknown as Morphable)
            if (!polymorphs) return;
            for (const polymorph of polymorphs) {
               // polymorph.discardCached(key)
            }
         },
         discardOthers() {
            const polymorphs = polymorphMap.get(this as unknown as Morphable)
            if (!polymorphs) return;
            // TODO:
         },
         discardAll(options: { except: [] }) {
            const polymorphs = polymorphMap.get(this as unknown as Morphable)
            if (!polymorphs) return;
            // TODO: 
         }
      })
   }
   return $Polymorph
}

type DynamicRenderKit = {
   nodePod: NodePod | undefined;
   flask: Flask | undefined;
   renderConditional: (parent: Element, nodePod: NodePod, input: Object | undefined) => NodeEntity[]
   transitionNodes: TransitionNode[] | undefined;
   cached: NodeEntity[] | undefined;
   input: Object | undefined;
   inputRequired: boolean
}

function createDynamicRenderKitOrMap(render: RenderFunction, input: Object | undefined): DynamicRenderKit | Map<Object, DynamicRenderKit> {
   if (input) {
      const map = new Map([[input, createDynamicRenderKit(render)]]) as VariantMap
      map.render = render;
      return map;
   }
   return createDynamicRenderKit(render)
}

function createDynamicRenderKit(render: RenderFunction): DynamicRenderKit {

   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return {
      nodePod: new NodePod(),
      flask: undefined as Flask | undefined,
      renderConditional: toRenderTransient(render, [REGISTER_TRANSITION_NODE(registerTransitionNode)]),
      transitionNodes,
      cached: undefined,
      input: undefined,
      inputRequired: render.length !== 0
   }
}




type VariantMap = Map<Object, DynamicRenderKit> & { render: RenderFunction }

export class PolymorphKit {
   // store contextual state
   context: Map<string | symbol, any> = $_snap_context()
   outerFlask: Flask = getViewFlask()
   phasicNode?: TransitionNode | null = getPhasicNode()

   // setup essentials
   dynamicPod: DynamicPod = new NodePod()
   __DEV__asyncPath = __DEV__ ? __DEV__buildAsyncPath() : undefined

   constructor(
      public switchMap: { [key: string]: RenderFunction | DynamicRenderKit | VariantMap },
      public $activeKey: Morphable,
   ) {
   }

   setUp(
      parent: Element
   ) {
      const $activeKey = this.$activeKey
      const morphable = this

      watch($activeKey, function updateMorphicComponent({ current: key, previous }) {
         // remove previous
         morphable.deactivateConditional(previous)

         // render new morph
         morphable.activateConditional(key, parent)

      })
      return this;
   }

   mount(
      parent: Element,
      fragment?: DocumentFragment
   ) {
      this.activateConditional(this.$activeKey(), parent, fragment)
   }

   render(kit: DynamicRenderKit, parent: Element, fragment?: DocumentFragment) {
      const context = this.context;
      context.set(FLASK, kit.flask);

      $_run_with_(context, () => {
         const nodeEntities = kit.cached ?? (kit.cached = kit.renderConditional(parent, kit.nodePod!, kit.input))
         mountConditional(parent, kit.nodePod!, nodeEntities, fragment);
      })
   }

   deactivateConditional(id: string | [string, Object]) {
      const key = typeof id === 'string' ? id : id[0]
      const input = typeof id === 'string' ? undefined : id[1]
      const kitOrMap = this.switchMap[key] as DynamicRenderKit
      const kit = kitOrMap instanceof Map ? kitOrMap.get(input) : kitOrMap
      const flask = kit.flask
      console.log('kit', kit)
      flask?.emitDemount()
      removeDOMNodes(kit.nodePod!);
   }

   activateConditional(id: string | [string, Object], parent: Element, fragment?: DocumentFragment) {
      const key = typeof id === 'string' ? id : id[0]
      const input = typeof id === 'string' ? undefined : id[1]
      const kitOrRenderfunctionOrMap = this.switchMap[key]
      const isInitialMount = isFunction(kitOrRenderfunctionOrMap)
      const kit = isFunction(kitOrRenderfunctionOrMap) ?
         (toKit(this.switchMap[key] = createDynamicRenderKitOrMap(kitOrRenderfunctionOrMap, input), input))
         : toKit(kitOrRenderfunctionOrMap, input)
      if (!kit) {
         if (__DEV__) console.error('dynamic render kit missing')
         return;
      }
      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view' }))
      kit.input = input;
      this.render(kit, parent, fragment)
      if (isInitialMount)
         flask.emitInitialMount()
      else
         flask.emitRemount() // remount preserved watchers etc.
   }
}


function toKit(arg: DynamicRenderKit | VariantMap, input: undefined | Object): DynamicRenderKit | undefined {
   if (arg instanceof Map) {
      if (input) {
         const kit = arg.get(input)
         if (kit) return kit;
         const newKit = createDynamicRenderKit(arg.render)
         arg.set(input, newKit)
         return newKit;
      }
      else console.error('Input object required with this polymorph key. Call .as() with key and input object')
   }
   else {
      return arg;
   }
}


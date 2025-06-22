import { isFunction, normalizeToArray } from "@rue/utils";
import { Component, unnestComponent } from "../component/Component";
import { getViewFlask } from "../flask/ViewFlask";
import { JSXNode, RenderFunction } from "../node/makeNode";
import { mountConditional } from "./ConditionalRenderSeries";
import { getClosestCommons, getCommons, popCommons, pushCommons } from "../commons/commons-stack";
import { Commons, NodeCommons, Provided, wrapWithCommons } from "../commons/Commons";
import { setUpNodeEntities } from "../node/setUpNodeEntities";
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

type Morphable = MutableIon<string> & {
   as(key: string): void;
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

   $Polymorph.morphable = function morphable(key: string): Morphable {

      return ion(key, {
         as(key: string) {
            if (this.state === key) return key;
            this.state = key
            return key;
         },
         discard(key: string) {
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
   renderConditional: RenderTransient
   transitionNodes: TransitionNode[] | undefined;
   cached: JSXNode[] | undefined
}

function createDynamicRenderKit(render: RenderFunction): DynamicRenderKit {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return {
      nodePod: new NodePod(),
      flask: undefined as Flask | undefined,
      renderConditional: wrapToPreserve(toRenderTransient(render, [REGISTER_TRANSITION_NODE(registerTransitionNode)])),
      transitionNodes,
      cached: undefined
   }
}




export class PolymorphKit {
   // store contextual state
   context: Map<string | symbol, any> = $_snap_context()
   outerFlask: Flask = getViewFlask()
   phasicNode?: TransitionNode | null = getPhasicNode()

   // setup essentials
   dynamicPod: DynamicPod = new NodePod()
   __DEV__asyncPath = __DEV__ ? __DEV__buildAsyncPath() : undefined

   constructor(
      public switchMap: { [key: string]: RenderFunction | DynamicRenderKit },
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
         const nodeEntities = kit.renderConditional(parent, kit.nodePod!)
         mountConditional(parent, kit.nodePod!, nodeEntities, fragment);
      })
   }

   deactivateConditional(key: string) {
      const kit = this.switchMap[key] as DynamicRenderKit
      const flask = kit.flask
      console.log('kit', kit)
      flask?.emitDemount()
      removeDOMNodes(kit.nodePod!);
   }

   activateConditional(key: string, parent: Element, fragment?: DocumentFragment) {
      const kitOrRenderfunction = this.switchMap[key]
      const isInitialMount = isFunction(kitOrRenderfunction)
      const kit = isFunction(kitOrRenderfunction) ? (this.switchMap[key] = createDynamicRenderKit(kitOrRenderfunction) ): kitOrRenderfunction
      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view' }))
      this.render(kit, parent, fragment)
      if (isInitialMount)
         flask.emitInitialMount()
      else
         flask.emitRemount() // remount preserved watchers etc.
   }
}




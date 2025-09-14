import { isFunction, normalizeToArray } from "@rue/utils";
import { Component, unnestComponent } from "../component/Component";
import { JSXNode, RawJSXNode } from "../node/makeJSXNode";
import { mountConditional } from "./ConditionalRenderSeries";
import { Commons, createCommonsNode, NodeCommons, Provided } from "../commons/Commons";
import { NodeEntity } from "../node/setUpNodeEntities";
import { DynamicPod, NodePod, removeDOMNodes } from "../node/NodePod";
import { $_run_with_, $_snap_context, ContextSnapshot, FLASK, Flask, getFlask } from "@rue/flask";
import { FromTag } from "../component/Input";
import { ion, Ion, isIon, MutableIon, toValue, watch } from "@rue/quarky";
import { useTransitionNodes } from "../transition/TransitNode";
import { TransitionNode } from "../transition/TransitionNode";
import { getPhasicNode } from "../transition/PhasicNode";
import { __DEV__buildAsyncPath } from "../../../flask/debug";
import { toRenderTransient } from "../dynamic/DynamicKit";
import { queueInternalRenderTask, watchToRender } from "../render-cycle";
import { COMMONS, getClosestCommons } from "../commons/commons-stack";



//TODO: 
// [X] implement static polymorph
// [X] implement dynamic finite polymorph
// [X] implement dynamic infinite polymorph
// [ ] implement discard in infinite polymorph

type PolymorphKey = string | symbol | Object

export type Morphable = MutableIon<PolymorphKey | [PolymorphKey, Object] | null> & {
   as(key: PolymorphKey | null, input?: Object): void;
   discard(key: PolymorphKey, input?: Object): void
   discardOthers(): void
   discardAll(): void
}

const polymorphMap: Map<Morphable, PolymorphKit[]> = new Map();

function registerPolymorph($activeKey: Morphable, polymorph: PolymorphKit) {
   const polymorphs = polymorphMap.get($activeKey) ?? []
   polymorphs.push(polymorph)
   polymorphMap.set($activeKey, polymorphs)
}

type RenderFunction = ((...args: [never] | [any]) => RawJSXNode)


export function Polymorph(entries: [PolymorphKey, RenderFunction][], options?: { preserve: true }) {
   const switchMap = new Map(entries)

   function $Polymorph(input: FromTag<{
      as: Morphable | PolymorphKey, //TODO: fromTag needs to handle mixed ion or not-ion type.
      with?: Object,
      provide?: Provided
   }>): Component {
      const { _raw_: { as: activeKey }, provide, with: inputObj } = input
      if (!isIon(activeKey)) {
         if (!switchMap.has($activeKey)) {
            return { exposed: undefined, jsxNodes: [] };
         }
         return {
            exposed: undefined,
            jsxNodes: normalizeToArray(
               provide ?
                  Commons({ provide, Slot: () => unnestComponent(switchMap.get(activeKey)!(inputObj!)) })
                  : unnestComponent(switchMap.get(activeKey)!(inputObj!)))
         }
      }

      const polymorphKit = new PolymorphKit(switchMap, activeKey as Morphable, options?.preserve)
      registerPolymorph(activeKey as Morphable, polymorphKit)

      return { exposed: undefined, jsxNodes: [polymorphKit] };
   }

   $Polymorph.has = function has(key: PolymorphKey) {
      return switchMap.has(key);
   }
   $Polymorph.Morphable = function Morphable(initialKey: PolymorphKey | null, input?: Object): Morphable {
      const morphable = ion(input ? [initialKey, input] : initialKey, {
         as(key: PolymorphKey | null, input?: Object) {
            if (input) {
               if (Array.isArray(this.state) && this.state[0] === key && this.state[1] === input)
                  return;
               this.state = [key, input]
               return;
            }
            if (this.state === key) return;
            this.state = key
            return;
         },
         discard(key: PolymorphKey, input?: Object) {
            const polymorphs = polymorphMap.get(morphable as Morphable)
            if (!polymorphs) return;
            for (const polymorph of polymorphs) {
               polymorph.discard(key, input)
            }
         },
         discardOthers() {
            const polymorphs = polymorphMap.get(morphable as Morphable)
            if (!polymorphs) return;
            // TODO:
         },
         discardAll(options: { except: [] }) {
            const polymorphs = polymorphMap.get(morphable as Morphable)
            if (!polymorphs) return;
            // TODO: 
         }
      })
      return morphable as Morphable
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

function createDynamicRenderKitOrMap(render: RenderFunction, input: Object | undefined, nodePod: NodePod, context: ContextSnapshot): DynamicRenderKit | VariantMap {
   if (input) {
      const map = new Map([[input, createDynamicRenderKit(render, nodePod, context)]]) as VariantMap
      map.render = render;
      return map;
   }
   return createDynamicRenderKit(render, nodePod, context)
}

function createDynamicRenderKit(render: RenderFunction, nodePod: NodePod, context: ContextSnapshot): DynamicRenderKit {
   console.log('^^^ context', context)

   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   const commons = createCommonsNode([REGISTER_TRANSITION_NODE(registerTransitionNode)], getClosestCommons(context))

   return {
      nodePod,
      flask: undefined as Flask | undefined,
      renderConditional: toRenderTransient(render, context, commons),
      transitionNodes,
      cached: undefined,
      input: undefined,
      inputRequired: render.length !== 0
   }
}


type VariantMap = Map<Object, DynamicRenderKit> & { render: RenderFunction }

export class PolymorphKit {
   // store contextual state
   context: ContextSnapshot = $_snap_context()
   outerFlask: Flask = getFlask()
   phasicNode?: TransitionNode | null = getPhasicNode()

   // setup essentials
   dynamicPod: DynamicPod = new NodePod()
   sharedNodePod: NodePod | undefined
   __DEV__asyncPath = __DEV__ ? __DEV__buildAsyncPath() : undefined

   constructor(
      public switchMap: Map<PolymorphKey, RenderFunction | DynamicRenderKit | VariantMap>,
      public $activeKey: Morphable,
      public preserve: boolean = false
   ) {
      const nodePod = this.sharedNodePod = preserve ? undefined : new NodePod()
      if (nodePod) this.dynamicPod.push(nodePod)
   }

   setUp(
      parent: Element
   ) {
      const $activeKey = this.$activeKey
      const morphable = this

      watchToRender($activeKey, function updateMorphicComponent({ current: key, previous }) {
         // remove previous
         if (previous)
            morphable.deactivateConditional(previous)

         // render new morph
         if (key)
            morphable.activateConditional(key, parent)

      }, this.outerFlask)
      return this;
   }

   mount(
      parent: Element,
      fragment?: DocumentFragment
   ) {
      const activeKey = this.$activeKey()
      if (!activeKey) return;
      this.activateConditional(activeKey, parent, fragment)
   }

   render(kit: DynamicRenderKit, parent: Element, fragment?: DocumentFragment) {
      const context = this.context;

      $_run_with_(context, () => {
         const nodeEntities = this.preserve ?
            kit.cached ?? (kit.cached = //TODO: allow choice between remount and create
               kit.renderConditional(parent, kit.nodePod!, kit.input)
            ) : kit.renderConditional(parent, kit.nodePod!, kit.input)
         mountConditional(parent, kit.nodePod!, nodeEntities, this.outerFlask, fragment);
      }, {
         [FLASK]: kit.flask
      })
   }

   deactivateConditional(id: PolymorphKey | [PolymorphKey, Object]) {
      const key = Array.isArray(id) ? id[0] : id
      const input = Array.isArray(id) ? id[1] : undefined
      const kitOrMap = this.switchMap.get(key) as DynamicRenderKit
      if (!kitOrMap) return;
      const kit = (kitOrMap instanceof Map ? kitOrMap.get(input) : kitOrMap) as DynamicRenderKit
      if (!kit) return;
      const flask = kit.flask

      flask?.emitDemount()
      // removeDOMNodes(kit.nodePod!); //TODO: how do I manage this 
      // queueInternalRenderTask(() => {
      removeDOMNodes(kit.nodePod!);
      if (!this.preserve) kit.nodePod!.clear()
      // }, this.outerFlask)
   }

   private getNodePod() {
      if (this.sharedNodePod) return this.sharedNodePod;
      const nodePod = new NodePod()
      this.dynamicPod.push(nodePod)
      return nodePod
   }

   activateConditional(id: PolymorphKey | [PolymorphKey, Object], parent: Element, fragment?: DocumentFragment) {
      const key = Array.isArray(id) ? id[0] : id
      const input = Array.isArray(id) ? id[1] : undefined
      const kitOrRenderfunctionOrMap = this.switchMap.get(key)
      if (!kitOrRenderfunctionOrMap) return;
      const isInitialMount = isFunction(kitOrRenderfunctionOrMap)
      const kitOrMap = isFunction(kitOrRenderfunctionOrMap) ? createDynamicRenderKitOrMap(kitOrRenderfunctionOrMap, input, this.getNodePod(), { ...this.context }) : kitOrRenderfunctionOrMap
      if (isInitialMount) this.switchMap.set(key, kitOrMap)
      const kit = toKit(kitOrMap, input)
      if (!kit) {
         if (__DEV__) console.error('dynamic render kit missing')
         return;
      }
      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view' }))
      kit.input = input;

      queueInternalRenderTask(() => {
         this.render(kit, parent, fragment)
         kit.nodePod!.activate() // needs to be queued since deactivation is also queued
         if (isInitialMount)
            flask.emitInitialMount()
         else
            flask.emitRemount() // remount preserved watchers etc.
      }, this.outerFlask)

      // this.render(kit, parent, fragment)
      // if (isInitialMount)
      //    //  queueInternalRenderTask(()=>
      //    flask.emitInitialMount()
      // // , this.outerFlask)
      // else
      //    // queueInternalRenderTask(()=>
      //    flask.emitRemount()
      // // , this.outerFlask) // remount preserved watchers etc.
   }

   discard(key: PolymorphKey, input?: Object) {
      if (this.isActiveKey(key, input)) {
         //TODO: This is the diamond problem... if the watch() is not sync, then we'd have to perform discard after update... 
         // but how would anyone know whether the update were synchronous or batched?
         // we want state manipulation to be synchronous but then schedule the rendering...
         // but synchronous calls can end up with extraneous effects
         this.deactivateConditional(this.$activeKey.state!)
         this.$activeKey.as(null)
      }
      const kitOrMap = this.switchMap.get(key)
      if (!kitOrMap) return;
      if (input && kitOrMap instanceof Map) {
         kitOrMap.delete(input)
      }
      if ('cached' in kitOrMap) {
         kitOrMap.cached = undefined;
      }
   }

   isActiveKey(key: PolymorphKey, input?: Object) {
      const activeKey = this.$activeKey.state
      if (activeKey === null) return;
      if (activeKey instanceof Array) {
         return activeKey[0] === key && activeKey[1] === input
      }
      return activeKey === key
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


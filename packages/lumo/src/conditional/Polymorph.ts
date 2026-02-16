import { isFunction, normalizeToArray } from "@rue/utils";
import { Component, unnestComponent } from "../component/Component";
import { RawJSXNode } from "../node/makeJSXNode";
import { Commons, createCommonsNode, NodeCommons, Provided } from "../context/Context";
import { $_run_with_, $_snap_context, ContextSnapshot, FLASK, Flask, getFlask } from "@rue/flask";
import { FromTag } from "../component/Input";
import { Ion, isGetter, isIon, MutableIon, PRELUDE, queueInternalRender, toValue, watch, watchToRender } from "@rue/quarky";
import { useTransitionNodes } from "../transition/TransitNode";
import { TransitionNode } from "../transition/TransitionNode";
import { getPhasicNode } from "../transition/PhasicNode";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { COMMONS, getClosestCommons } from "../context/context-stack";
import { AsyncRender, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, setUpNodeVine, toAsyncRender, VineNode } from "../node/VineNode";



// TODO: 
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
      as: Morphable | PolymorphKey, // TODO: fromTag needs to handle mixed ion or not-ion type.
      with?: Object,
      provide?: Provided
   }>): Component {
      const { _raw_: { as: activeKey }, provide, with: inputObj } = input
      if (!isGetter(activeKey)) {
         if (!switchMap.has(activeKey)) {
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
      const morphable = Ion(input ? [initialKey, input] : initialKey, {
         as(key: PolymorphKey | null, input?: Object) {
            if (input) {
               if (Array.isArray(this.value) && this.value[0] === key && this.value[1] === input)
                  return;
               this.value = [key, input]
               return;
            }
            if (this.value === key) return;
            this.value = key
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
   nodes: (JSXNode[]) | null
   flask: Flask | undefined;
   render: AsyncRender;
   type: 'create' | 'remount';
   transitionNodes: TransitionNode[] | undefined;
   cache: JSXNode[] | undefined;
}

type PolymorphRenderKit = {
   input: Object | undefined;
   inputRequired: boolean
} & DynamicRenderKit

function createDynamicRenderKitOrMap(render: RenderFunction, input: Object | undefined, context: ContextSnapshot): PolymorphRenderKit | VariantMap {
   if (input) {
      const map = new Map([[input, createDynamicRenderKit(render, context)]]) as VariantMap
      map.render = render;
      return map;
   }
   return createDynamicRenderKit(render, context)
}

function createDynamicRenderKit(render: RenderFunction, context: ContextSnapshot): PolymorphRenderKit {
   console.log('^^^ context', context)

   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   const commons = createCommonsNode([REGISTER_TRANSITION_NODE(registerTransitionNode)], getClosestCommons(context))

   return {
      flask: undefined as Flask | undefined,
      render: toAsyncRender(render, context, { [FLASK]: undefined, [COMMONS]: commons, [TRACE]:  __DEV__ ? __DEV__buildAsyncPath() : '' }),
      transitionNodes,
      cache: undefined,
      awaitCache: undefined,
      type: 'create',
      input: undefined,
      inputRequired: render.length !== 0
   }
}


type VariantMap = Map<Object, PolymorphRenderKit> & { render: RenderFunction }

export class PolymorphKit extends VineNode {
   // store contextual state
   context: ContextSnapshot = $_snap_context()
   outerFlask: Flask = getFlask()
   phasicNode?: TransitionNode | null = getPhasicNode()

   // setup essentials
   // dynamicPod: DynamicPod = new NodePod()
   // sharedNodePod: NodePod | undefined
   __DEV__asyncPath =  __DEV__ ? __DEV__buildAsyncPath() : undefined

   constructor(
      public switchMap: Map<PolymorphKey, RenderFunction | PolymorphRenderKit | VariantMap>,
      public $activeKey: Morphable,
      public preserve: boolean = false
   ) {
      super()
      this.activateConditional($activeKey(), (kit) => {
         kit.flask!.emitInitialMount()
      })

      watchToRender($activeKey, ({ current: key, previous, flask }) => {
         if (key == previous) return;
         // remove previous
         if (previous)
            this.deactivateConditional(previous)

         // render new morph
         if (key)
            this.activateConditional(key, (kit) => {
               setUpNodeVine(kit.nodes!, this.parent!, this.preceding)
               const fragment = new DocumentFragment()
               mountDOMNodes(kit.nodes!, fragment)
               queueInternalRender(() => {
                  mountFragment(fragment, this.precedingLeaf, this.parent)
               }, flask)
               kit.type === 'create' ? kit.flask!.emitInitialMount() : kit.flask!.emitRemount()
            })
      })
   }

   // render(kit: DynamicRenderKit, parent: Element, fragment?: DocumentFragment) {
   //    const context = this.context;

   //    $_run_with_(context, () => {
   //       const nodeEntities = this.preserve ?
   //          kit.cache ?? (kit.cache = // TODO: allow choice between remount and create
   //             kit.renderConditional(parent, kit.nodePod!, kit.input)
   //          ) : kit.renderConditional(parent, kit.nodePod!, kit.input)
   //       mountConditional(parent, kit.nodePod!, nodeEntities, this.outerFlask, fragment);
   //    }, {
   //       [FLASK]: kit.flask
   //    })
   // }

   activateConditional(id: PolymorphKey | [PolymorphKey, Object], emitActivated: (kit: PolymorphRenderKit) => void) {

      const kit = this.toKit(id)
      if (!kit) {
         if ( __DEV__) console.error('dynamic render kit missing')
         return;
      }

      console.log('>>> kit.type', kit.type)

      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === "create" }))
      kit.nodes = this.nodes =
         kit.type === 'remount' ?
            (kit.cache ?? (kit.cache = processJSXOutput(kit.render(flask))))
            : processJSXOutput(kit.render(flask));

      emitActivated(kit)
   }

   deactivateConditional(id: PolymorphKey | [PolymorphKey, Object]) {
      const key = Array.isArray(id) ? id[0] : id
      const input = Array.isArray(id) ? id[1] : undefined
      const kitOrMap = this.switchMap.get(key) as DynamicRenderKit
      if (!kitOrMap) return;
      const kit = (kitOrMap instanceof Map ? kitOrMap.get(input) : kitOrMap) as DynamicRenderKit
      if (!kit) return;

      const prevNodes = kit.nodes;
      if (!prevNodes) return;

      kit.nodes = null;

      if (kit.type === 'create') {
         kit.flask!.emitDiscard()
         kit.flask = undefined
      }
      else kit.flask!.emitDemount()

      queueInternalRender(() => {
         removeDOMNodes(prevNodes)
      })
      return kit;
   }


   discard(key: PolymorphKey, input?: Object) {
      if (this.isActiveKey(key, input)) {
         // TODO: This is the diamond problem... if the watch() is not sync, then we'd have to perform discard after update... 
         // but how would anyone know whether the update were synchronous or batched?
         // we want state manipulation to be synchronous but then schedule the rendering...
         // but synchronous calls can end up with extraneous effects
         this.deactivateConditional(this.$activeKey.value!)
         this.$activeKey.as(null)
      }
      const kitOrMap = this.switchMap.get(key)
      if (!kitOrMap) return;
      if (input && kitOrMap instanceof Map) {
         kitOrMap.delete(input)
      }
      if ('cache' in kitOrMap) {
         kitOrMap.cache = undefined;
      }
   }

   isActiveKey(key: PolymorphKey, input?: Object) {
      const activeKey = this.$activeKey.value
      if (activeKey === null) return;
      if (activeKey instanceof Array) {
         return activeKey[0] === key && activeKey[1] === input
      }
      return activeKey === key
   }

   toKit(id: PolymorphKey | [PolymorphKey, Object]): PolymorphRenderKit | undefined {
      const key = Array.isArray(id) ? id[0] : id
      const input = Array.isArray(id) ? id[1] : undefined
      const kitOrRenderfunctionOrMap = this.switchMap.get(key)
      if (!kitOrRenderfunctionOrMap) return;

      const isInitialMount = isFunction(kitOrRenderfunctionOrMap)
      const kitOrMap = isFunction(kitOrRenderfunctionOrMap) ? createDynamicRenderKitOrMap(kitOrRenderfunctionOrMap, input, { ...this.context }) : kitOrRenderfunctionOrMap
      if (isInitialMount) this.switchMap.set(key, kitOrMap)

      if (kitOrMap instanceof Map) {
         if (input) {
            const kit = kitOrMap.get(input)
            if (kit) {
               if (this.preserve) kit.type = 'remount'
               kit.input = input
               return kit;
            }
            const newKit = createDynamicRenderKit(kitOrMap.render, this.context)
            kitOrMap.set(input, newKit)
            if (this.preserve) newKit.type = 'remount'
            newKit.input = input
            return newKit;

         }
         else console.error('Input object required with this polymorph key. Call .as() with key and input object')
      }
      else {
         if (this.preserve) kitOrMap.type = 'remount'
         kitOrMap.input = input
         return kitOrMap;
      }
   }
}




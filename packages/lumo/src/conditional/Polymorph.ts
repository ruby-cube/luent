import { normalizeToArray } from "@rue/utils";
import { Component, unnestComponent } from "../component/Component";
import { getViewFlask } from "../flask/ViewFlask";
import { JSXNode, RenderFunction } from "../node/makeNode";
import { mountNodeEntities } from "../node/mountNodeKits";
import { mountConditional } from "./ConditionalRenderSeries";
import { getClosestCommons, getCommons, popCommons, pushCommons } from "../commons/commons-stack";
import { Commons, NodeCommons, Provided, wrapWithCommons } from "../commons/Commons";
import { AppCommons } from "../commons/provide";
import { setUpNodeEntities } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { $_run_with_, $_snap_context, FLASK, Flask } from "@rue/flask";
import { fromTag } from "../component/fromTag";
import { ion, Ion, isIon, toValue, watch } from "@rue/quarky";
import { TRACE } from "../../../flask/debug";
import { useTransitionNodes } from "../transition/TransitNode";
import { TransitionNode } from "../transition/TransitionNode";



//TODO: 
// [] implement static polymorph
// [] implement dynamic finite polymorph
// [] implement dynamic infinite polymorph

type Morphable = Ion<string> & {
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
      provide: Provided //TODO:
   }>()): Component {
      const { $as: $activeKey, provide } = input

      if (typeof $activeKey === 'string') {
         return {
            exposed: undefined,
            jsxNodes: normalizeToArray(provide ? Commons({ provide, Slot: switchMap[$activeKey] }) : unnestComponent(switchMap[$activeKey]()))
         }
      }

      const polymorphKit = new PolymorphKit(
         switchMap,
         $activeKey,
         getCommons(),
         getViewFlask()
      )
      registerPolymorph($activeKey, polymorphKit)

      return { exposed: undefined, jsxNodes: [polymorphKit] };
   }

   $Polymorph.morphable = (key: string) => {

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
               polymorph.discardCached(key)
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
   renderConditional: (parent: Element, nodePod: NodePod) => JSXNode[];
   transitionNodes: TransitionNode[] | undefined;
   cached: JSXNode[] | undefined
}

function createDynamicRenderKit(render: RenderFunction) {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
   return {
      nodePod: undefined as NodePod | undefined,
      flask: undefined as Flask | undefined,
      renderConditional: renderWithCommons(render, [REGISTER_TRANSITION_NODE(registerTransitionNode)]),
      transitionNodes,
   }
}

function renderWithCommons(renderConditional: RenderFunction, provide: Provided) {
   const parentCommons = getClosestCommons()
   if (!parentCommons) throw new Error('commons missing')
   return (parent: Element, nodePod: NodePod) =>
      setUpNodeEntities(normalizeToArray(wrapWithCommons(provide, () => renderConditional, parentCommons)), parent, nodePod)
}


export class PolymorphKit {

   constructor(
      public switchMap: { [key: string]: RenderFunction | DynamicRenderKit },
      public activeKey: Morphable | string,
      public commons: NodeCommons | AppCommons,
      public outerFlask: Flask
   ) {
      this.renderedKeys = new Set([toValue(activeKey)])
   }

   renderedKeys: Set<string>;

   // nodeEntities!: JSXNode[]

   flask!: Flask
   dynamicNodePod!: NodePod
   context: Map<string | symbol, any> = $_snap_context()

   mount(
      parent: Element,
      fragment?: DocumentFragment
   ) {
      const nodePod = this.dynamicNodePod[0] as NodePod
      nodePod.activate()

      const flask = this.flask

      // this.render(parent, fragment, flask)

      //TODO: 
      const nodeEntities = setUpNodeEntities(normalizeToArray(unnestComponent(this.switchMap[toValue(this.activeKey)]())), parent, nodePod);
      pushCommons(this.commons)
      this.flask.containCall(function renderMorphicNode() {
         mountNodeEntities(nodeEntities, parent, fragment)
      })
      popCommons()
      flask.emitInitialMount()
   }

   // private render(parent: Element, fragment?: DocumentFragment, flask?: Flask) {
   //    const context = this.context;
   //    if (flask) context.set(FLASK, flask);
   //    if (__DEV__) context.set(TRACE, this.__DEV__asyncPath)

   //    $_run_with_(context, () => {
   //       const nodeEntities = kit.renderConditional(parent, kit.nodePod || (console.warn('DEV RESEARCH: no kit pod :('), this.nodePod))
   //       mountConditional(parent, kit.nodePod!, nodeEntities, fragment);
   //    })
   // }



   setUp(
      parent: Element,
      nodePod: NodePod,
   ) {
      const dynamicPod = this.dynamicNodePod = nodePod.appendNodePod()
      const _nodePod = dynamicPod.appendNodePod()
      this.flask = this.outerFlask.spawn({ type: 'view' })
      const $activeKey = this.activeKey
      if (!isIon($activeKey)) return this;

      const morphable = this
      watch($activeKey, function updateMorphicComponent({ current: key }) {
         morphable.activeKey = key;

         // remove previous
         morphable.deactivate()

         // render new morph
         pushCommons(morphable.commons)
         morphable.activate(key, parent, _nodePod)
         popCommons()

      })
      return this;
   }

   deactivate() {
      const flask = this.flask
      //TODO:
      flask.emitDiscard()

   }

   activate(key: string, parent: Element, nodePod: NodePod) {
      const flask = this.flask = this.outerFlask.spawn({ type: 'view' })
      const _this = this
      if (this.renderedKeys.has(key)) {
         flask.emitRemount() //FIX:
      } else {
         flask.containCall(function reactivateMorphicForm() {
            const nodeEntities = normalizeToArray(unnestComponent(_this.switchMap[key]()))
            mountConditional(parent, _this.dynamicNodePod, nodeEntities)
         })
      }
   }
}




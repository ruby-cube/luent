import { normalizeToArray } from "@rue/utils";
import { Component, unnestComponent } from "../component/InternalComponent";
import { getViewFlask } from "../flask/ViewFlask";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { mountConditional } from "../conditional/ConditionalRenderSeries";
import { getCommons, getClosestCommons, popCommons, pushCommons } from "../commons/commons-stack";
import { NodeCommons } from "../commons/Commons";
import { AppCommons } from "../commons/provide";
import { setUpNodeEntities } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { Flask } from "@rue/flask";

export function MorphicNode(switchMap: { [key: string]: RenderFunction }) {
   return function $MorphicNode({ as: initialKey, preserve }: {
      as: string,
      preserve?: true
   }) {
      const morphicRenderKit = new MorphicRenderKit(
         switchMap,
         initialKey,
         !!preserve,
         getCommons(),
         getViewFlask()
      )

      return {
         exposedComponent: {
            as(key: string) {
               if (morphicRenderKit.activeKey === key) return;
               morphicRenderKit.render(key)
            }
         },
         renderedTemplate: morphicRenderKit
      } satisfies Component
   }
}


export class MorphicRenderKit {

   // nodePodSwitchMap: Map<string, NodePod> = new Map()

   constructor(
      public switchMap: { [key: string]: RenderFunction },
      public activeKey: string,
      public preserve: boolean,
      public commons: NodeCommons | AppCommons,
      public outerFlask: Flask
   ) {
      if (preserve) {
         this.renderedKeys = new Set()
         this.renderedKeys.add(activeKey);
      }
   }

   render!: (key: string) => void

   renderedKeys?: Set<string>;

   // nodeEntities!: NodeEntity[]

   flask!: Flask
   dynamicNodePod!: NodePod

   mount(
      parent: Element,
      fragment?: DocumentFragment
   ) {
      const nodePod = this.dynamicNodePod[0]
      //TODO: 
      const nodeEntities = setUpNodeEntities(normalizeToArray(unnestComponent(this.switchMap[this.activeKey]())), parent, nodePod);
      pushCommons(this.commons)
      this.flask.containCall(function renderMorphicNode() {
         mountNodeEntities(nodeEntities, parent, fragment)
      })
      popCommons()
   }

   setUp(
      parent: Element,
      nodePod: NodePod,
   ) {
      const dynamicPod = this.dynamicNodePod = nodePod.appendNodePod()
      const _nodePod = dynamicPod.appendNodePod()
      this.flask = this.outerFlask.spawn('view')

      this.render = function updateMorphicComponent(key: string) {
         this.activeKey = key;

         // pushDynamicNode(this.parentDynamicNode)
         // remove previous
         this.deactivateForm()

         // render new form
         pushCommons(this.commons)
         this.activateForm(key, parent, _nodePod)
         popCommons()

         // popDynamicNode()
      }
      return this;
   }

   deactivateForm() {
      const flask = this.flask
      if (this.preserve) {
         //TODO:
         flask.discard()
      }
      else {
         flask.discard()
      }
   }

   activateForm(key: string, parent: Element, nodePod: NodePod) {
      const flask = this.flask = this.outerFlask.spawn('view')
      const _this = this
      if (this.preserve && this.renderedKeys?.has(key)) {
         flask.remount() //FIX:
      } else {
         flask.containCall(function reactivateMorphicForm() {
            const nodeEntities = normalizeToArray(unnestComponent(_this.switchMap[key]()))
            mountConditional(parent, _this.dynamicNodePod, nodeEntities)
         })
      }
   }
}




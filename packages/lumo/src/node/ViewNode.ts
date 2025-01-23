import { ListenerOptions, SchedulerOptions } from "@rue/flask";
import { getActiveCommons, Context } from "../context/context-stack";
import { DynamicNode } from "../dynamic/DynamicNode";
import { _getDynamicNode } from "../dynamic/nodestack";
import { fromApp, fromCommons, fromGlobal } from "../context/provide";
import { ContextKeyMap } from "@rue/lumo";


type ViewNode = {
   readonly onCreated: (handler: () => void, options?: SchedulerOptions) => void
   readonly onDeactivate: (handler: () => void, options?: ListenerOptions) => void
   readonly onReactivate: (handler: () => void, options?: ListenerOptions) => void
   readonly onDiscard: (handler: () => void, options?: SchedulerOptions) => void
   readonly fromCommons: <K extends string | symbol>(key: K) => K extends keyof ContextKeyMap ? ContextKeyMap[K] extends () => { inputType: infer I } ? I : any : any
   readonly fromApp: <K extends string | symbol>(key: K) => K extends keyof ContextKeyMap ? ContextKeyMap[K] extends () => { inputType: infer I } ? I : any : any
   readonly fromGlobal: <K extends string | symbol>(key: K) => K extends keyof ContextKeyMap ? ContextKeyMap[K] extends () => { inputType: infer I } ? I : any : any
}

const viewNodeMap: Map<DynamicNode, Map<Context, ViewNode>> = new Map()

export function $thisNode() {
   const dynamicNode = _getDynamicNode();
   const context = getActiveCommons();
   if (!context) throw new Error(`no context node. This should never happen`)
   let contextMapCreated = false;
   let viewNodeCreated = false;
   const contextMap = viewNodeMap.get(dynamicNode) ?? (contextMapCreated = true, new Map([[context, createViewNode(context)]]));
   let viewNode = contextMap ? contextMap.get(context) : (viewNodeCreated = true, createViewNode(context))
   viewNode = viewNode ?? (viewNodeCreated = true, createViewNode(context))
   if (viewNodeCreated || contextMapCreated) contextMap.set(context, viewNode)
   if (contextMapCreated) viewNodeMap.set(dynamicNode, contextMap)
   return viewNode
}

function createViewNode(context: Context): ViewNode {
   return {
      fromCommons(key: string | symbol) {
         return fromCommons(key, context)
      },
      fromApp(key: string | symbol) {
         return fromApp(key, context)
      },
      fromGlobal(key: string | symbol) {
         return fromGlobal(key, context)
      },
      get onCreated() {
         const dynamicNode = _getDynamicNode()
         if (dynamicNode.onCreated) return dynamicNode.onCreated;
         return dynamicNode.initializeOnCreatedHook()
      },
      get onDiscard() {
         const dynamicNode = _getDynamicNode()
         return dynamicNode.onDiscard;
      },
      get onDeactivate() {
         const dynamicNode = _getDynamicNode()
         return dynamicNode.onDeactivate;
      },
      get onReactivate() {
         const dynamicNode = _getDynamicNode()
         return dynamicNode.onReactivate;
      }
   }
}


// setup...

// renderTemplate...


// created: setup completed, DOM nodes created, but not yet mounted (this distinction isn't really useful since you can manipulate the DOM any number of times before render and it should be fine)

// mounted

// deactivated

// reactivated

// unmounted

// destroyed



// view node
// onMount   if (isInitialMount)
// - onCreated
// - onReactivate
// onUnmount if (isFinalUnmount)
// - onDeactivated
// - onDestroyed


// dynamic node
// - onCreated (rendered)
// - onReactivate
// - onDeactivated
// - onDestroyed
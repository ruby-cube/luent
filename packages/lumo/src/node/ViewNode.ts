import { SchedulerOptions } from "@rue/flask";
import { getCurrentContext, Context } from "../context/context-stack";
import { DynamicNode } from "../dynamic/DynamicNode";
import { getActiveDynamicNode } from "../dynamic/nodestack";
import { appwide, contextual, transapp } from "../context/provide";
import { ContextKeyMap } from "@rue/lumo";


type ViewNode = {
    readonly onCreated: (handler: () => void, options?: SchedulerOptions) => void
    readonly onDestroy: (handler: () => void, options?: SchedulerOptions) => void
    readonly contextual: <K extends string | symbol>(key: K) => K extends keyof ContextKeyMap ? ContextKeyMap[K] extends () => { inputType: infer I } ? I : any : any
    readonly appwide: <K extends string | symbol>(key: K) => K extends keyof ContextKeyMap ? ContextKeyMap[K] extends () => { inputType: infer I } ? I : any : any
    readonly transapp: <K extends string | symbol>(key: K) => K extends keyof ContextKeyMap ? ContextKeyMap[K] extends () => { inputType: infer I } ? I : any : any
}

const viewNodeMap: Map<DynamicNode, Map<Context, ViewNode>> = new Map()

export function getThis() {
    const dynamicNode = getActiveDynamicNode();
    const context = getCurrentContext();
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
        contextual(key: string | symbol) {
            return contextual(key, context)
        },
        appwide(key: string | symbol) {
            return appwide(key, context)
        },
        transapp(key: string | symbol) {
            return transapp(key, context)
        },
        get onCreated() { 
            const dynamicNode = getActiveDynamicNode()
            if (dynamicNode.onCreated) return dynamicNode.onCreated;
            return dynamicNode.initializeOnCreatedHook()
        },
        get onDestroy() {
            const dynamicNode = getActiveDynamicNode()
            if (dynamicNode.onDestroy) return dynamicNode.onDestroy;
            return dynamicNode.initializeOnDestroyHook()
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
// - onReactivated
// onUnmount if (isFinalUnmount)
// - onDeactivated
// - onDestroyed


// dynamic node
// - onCreated (rendered)
// - onReactivated
// - onDeactivated
// - onDestroyed
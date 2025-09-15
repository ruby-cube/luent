import { RawJSXNode, RenderFunction, runWithGroupActivationReset } from "./makeJSXNode";
import { NodePod } from "./x_NodePod";
import { COMMONS, CommonsNode } from "../commons/commons-stack";
import { $_run_with_, ContextSnapshot, FLASK, Flask } from "@rue/flask";
import { TransitionNode } from "../transition/TransitionNode";
import { AnyObject } from "@rue/types";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";



export type AsyncRenderConditional = (flask: Flask, input?: Object) => RawJSXNode[]

export function toAsyncRenderConditional(render: RenderFunction, outerFlask: Flask, context: ContextSnapshot, newContext: { [FLASK]: Flask | undefined, [COMMONS]: CommonsNode, [TRACE]: string }): AsyncRenderConditional {
   return (flask: Flask, input?: Object) => {
      newContext[FLASK] = flask
      return $_run_with_(context, () => runWithGroupActivationReset(render, input), newContext)
   }
}


// export interface DynamicKit {
//    // store contextual state
//    context: Map<string | symbol, any>;
//    outerFlask: Flask
//    phasicNode: TransitionNode | null

//    dynamicPod: DynamicPod
//    __DEV__asyncPath: string | undefined

//    mount(parent: Element, fragment?: DocumentFragment): void
//    setUp(parent: Element): DynamicKit
// }

// export function isDynamicKit(value: unknown): value is DynamicKit {
//    return isObject(value) && 'dynamicPod' in value && 'setUp' in value;
// }

type ConditionalKit = {
   nodePod: NodePod;
   flask: Flask | undefined;
   renderConditional: (parent: Element, nodePod: NodePod) => any[];
   transitionNodes: TransitionNode[];
}

export interface ConditionalSeriesKit extends DynamicKit {
   render(kit: ConditionalKit & AnyObject, parent: Element, fragment?: DocumentFragment): void
   deactivateConditional(id: any): void
   activateConditional(id: any, parent: Element, fragment?: DocumentFragment): void
}

// export function wrapToPreserve(renderConditional: (parent: Element, nodePod: NodePod) => NodeEntity[]) {
//    let nodeEntities: NodeEntity[];
//    return (parent: Element, nodePod: NodePod) => {
//       if (nodeEntities) return nodeEntities;
//       return nodeEntities = renderConditional(parent, nodePod)
//    }
// }


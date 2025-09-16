import { RawJSXNode, RenderFunction, runWithGroupActivationReset } from "./makeJSXNode";
import { NodePod } from "./x_NodePod";
import { COMMONS, CommonsNode } from "../commons/commons-stack";
import { $_run_with_, ContextSnapshot, FLASK, Flask } from "@rue/flask";
import { TransitionNode } from "../transition/TransitionNode";
import { AnyObject } from "@rue/types";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { DynamicKit } from "./VineNode";






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



// export interface IfElseKit extends DynamicKit {
//    render(kit: ConditionalKit & AnyObject, parent: Element, fragment?: DocumentFragment): void
//    deactivateConditional(id: any): void
//    activateConditional(id: any, parent: Element, fragment?: DocumentFragment): void
// }

// export function wrapToPreserve(renderConditional: (parent: Element, nodePod: NodePod) => NodeEntity[]) {
//    let nodeEntities: NodeEntity[];
//    return (parent: Element, nodePod: NodePod) => {
//       if (nodeEntities) return nodeEntities;
//       return nodeEntities = renderConditional(parent, nodePod)
//    }
// }


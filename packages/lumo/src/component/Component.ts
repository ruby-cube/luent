import { AnyObject, Falsey } from "@rue/types";
import { ComponentConfig, RawJSXNode } from "../node/makeJSXNode";
import { INTERNAL, Ion, isIon, PRELUDE, queueInternalRender, toValue, watch } from "@rue/quarky";
import { isObject, normalizeToArray, Ref } from "@rue/utils";
import { $Node, $Nodes, initializeRef, InternalRef, isNodesRef } from "../node/NodeRef";
import { MaybeIon, toInput } from "./Input";
import { JSXNode } from "../node/VineNode";
import { NodeRefsConfig, setUpNodeRefs } from "../node/NodeRefs";
import { analyzeAttributes, createOverrideClasses } from "../element/makeElement";
import { setUpHooks } from "../flask/template-hooks";
import { getActiveFlask } from "@rue/flask";




// export type Slot = JSXNode
export type ComponentForge<P extends never | AnyObject = never | AnyObject> = P extends never ? () => Component : (setup?: P) => Component

export const COMPONENT = Symbol('publicComponent')
export type PublicComponent<T extends AnyObject = AnyObject> = T // contains anything in expose



export interface Component<T extends AnyObject | undefined = AnyObject | undefined> {
   exposed: T extends AnyObject ? PublicComponent<T> : undefined;
   jsxNodes: RawJSXNode[];
   // morphicRenderKit?: PolymorphKit
}

type JSXTemplate = RawJSXNode

// TODO: accept a third paramenter for mountTeleported
// compiler macro to transform jsx template into render function
export function template(template: JSXTemplate) {
   const jsxNodes = normalizeToArray(toValue(template ? unnestComponent(template) : undefined)) as RawJSXNode[]
   function ref<T extends AnyObject | undefined = AnyObject | undefined>(component: T) {
      console.log('ref()', component)
      return {
         exposed: component,
         jsxNodes
      }
   }
   return {
      exposed: undefined, // TODO: make read only
      jsxNodes,
      ref,
      style: (arg: any) => {
         // Style(strings, ...values)
         return {
            exposed: undefined,
            jsxNodes,
            ref
         }
      }
   }

}







function __DEV__leakProof(exposed: AnyObject) {
   // TODO: make sure everything has creationScopeID
}

function __DEV__assertInCreationScope(object: AnyObject) {
   // TODO: assert that object is within its creation scope
}

export function unnestComponent(jsxNodes: RawJSXNode) {
   const isArray = jsxNodes instanceof Array;
   if (isArray && jsxNodes.length > 1) return jsxNodes;
   const entity = isArray ? jsxNodes[0] : jsxNodes;
   if (isComponentKit(entity)) {
      if (entity.exposed)
         return jsxNodes;
      return entity.jsxNodes;
   }
   return jsxNodes
}

export function isComponentKit(entity: unknown): entity is Component {
   return isObject(entity) && 'exposed' in entity && 'jsxNodes' in entity
}



export type InferSlot<T extends ComponentForge = ComponentForge> =
   T extends (setup?: infer P) => any ?
   P extends { Slot: infer S } ?
   S
   : undefined
   : undefined

export type SetupWithSlot = {
   Slot: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
}

export type ComponentSetupWithSlot<P extends SetupWithSlot = SetupWithSlot> =
   (setup?: P) => JSXNode


// function toTokenList(classString: MaybeIon<string | Falsey>) {
//    if (!classString) return;
//    const classes = createTokenList()
//    if (isIon(classString)) {
//       const flask = getActiveFlask()
//       watch(classString, ({ previous, eager }) => {
//          queueInternalRender(() => {
//             const value = classString()
//             if (!eager && previous === value) return;
//             if (value) classes.value = value
//          }, flask)
//       }, { phase: PRELUDE, eager: true })

//    }
//    else {
//       classes.value = classString
//       return classes
//    }
// }

// function createTokenList() {
//    const div = document.createElement('div')
//    return div.classList
// }



export type ComponentTag = (arg: any) => JSX.Element

export function makeComponent(
   Component: ComponentForge,
   Slot: InferSlot | undefined,
   tag: ComponentConfig,
   // $index: Ion<number> | undefined
): Component {
   const { ref, class: classes, style, ...other } = tag
   const { hooks, events, attributes } = analyzeAttributes(other)

   const output = Component(toInput({
      ...other,
      Slot,
      classes: createOverrideClasses(classes)
      // classes: classString
      // styles: style ? toStyleDeclaration(style) : undefined // TODO:
   }))
   if (output instanceof Promise)
      throw new Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup")
   const publicComponent = output.exposed ?? {}
   console.log('public', publicComponent, ref)
   if (ref) {
      if (isObject(ref) && 'arr' in ref) {
         setUpNodeRefs(publicComponent, ref.arr, normalizeToArray(ref.i))
      }
      else {
         initializeRef(ref, publicComponent)
      }
   }
   setUpHooks(publicComponent ?? ref, hooks)

   // if (tag['display-if']) setUpConditionalDisplay()
   return output
}




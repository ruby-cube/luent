import { Component, ComponentSetup, exposeComponent } from "./Component";
import { ComponentConfig, JSXNode } from "../node/makeNode";
import { AnyObject } from "@rue/types";
import { Ion, neutron } from "@rue/quarky";
import { assertMutableIon, MU, muIonsStack } from "./Input";
import { toInput } from "./fromTag";

// on: T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;

export type ComponentOptions = { preserve?: true }



export type InferSlot<T extends ComponentSetup = ComponentSetup> =
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




// let componentAttributes: AnyObject | undefined

// export function getComponentAttributes() {
//    return componentAttributes;
// }

// export function setComponentAttributes(attributes: AnyObject | undefined) {
//    componentAttributes = attributes
// }

export function makeComponent(
   Component: ComponentSetup,
   Slot: InferSlot | undefined,
   config: ComponentConfig,
   $index: Ion<number> | undefined
): Component {
   //TODO: component flask lifecycle hooks
   const muIons: Set<Ion> = new Set()
   const attributes = {
      ...config,
      Slot,
      [MU](ion: Ion) {
         return muIons?.has(ion)
      }
   }
   // setComponentAttributes(attributes)
   muIonsStack.push(muIons)
   const output = Component(toInput(attributes))
   if (output instanceof Promise)
      throw new Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup")
   // setComponentAttributes(undefined);
   muIonsStack.pop()
   if (config.ref) exposeComponent(output.exposed ?? {}, config.ref, $index)
   return output
}



// export function composeEvents(
//     events: { [key: string]: Function | Function[] }[],
// ) {
//     const target: { [key: string]: Function[] } = {};
//     for (const _events of events) {
//         for (const key in _events) {
//             const value = _events[key];
//             if (key in target) {
//                 const handlers = target[key];
//                 if (value instanceof Array) {
//                     handlers.push(...value);
//                 }
//                 else {
//                     handlers.push(value)
//                 }
//             }
//             else {
//                 if (value instanceof Array) {
//                     target[key] = [...value]
//                 }
//                 else {
//                     target[key] = [value]
//                 }
//             }
//         }
//     }
//     return target as { [key: string]: (EventListener | DerivedIon<EventListener | null>)[] };
// }

// function assignAttributes(nodeEntity: JSXNode, attributes: AssignedAttributes) {
//     if (nodeEntity instanceof Element) { // from Web API
//         applyAttributes(nodeEntity, attributes);
//     }
//     else if (nodeEntity instanceof InternalComponent) {
//         assignAttributes(nodeEntity.nodeEntities[0], attributes)
//     }
//     else if (__DEV__) {
//         console.warn('assigned attributes cannot be automatically applied. Please assign manually.')
//     }
// }



// export function warnOverlappingKeys(propsA: AnyObject, propsB: AnyObject | undefined, propsC?: AnyObject) {
//     if (!propsC && !propsB) return;
//     if (propsC) {
//         for (const key in propsA) {
//             if (key in propsC) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
//         }
//         if (!propsB) return;
//         for (const key in propsA) {
//             if (key in propsB) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
//         }
//         for (const key in propsB) {
//             if (key in propsC) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
//         }
//     }
//     else if (propsB) {
//         for (const key in propsA) {
//             if (key in propsB) console.warn('Duplicate prop keys. Props from `setUpNode` will be overridden')
//         }
//     }
// }





// function setUpRefUpdates(ref: InternalNodeRef, component: Component, $index: AtomicIon<number> | undefined, preserve: boolean) {
//     if (ref.initialized === true) return;
//     // if ($index) { // only initiate once per list
//     //     const components = ref.components;
//     //     if (preserve) {
//     //         onDeactivated(() => {
//     //             ref.components = null;
//     //         })
//     //         onRemount(() => {
//     //             ref.components = components
//     //         })
//     //     }
//     //     beforeUnmount(() => {
//     //         ref.components = null;
//     //     })
//     // }
//     // else {
//     if (preserve) {
//         onDeactivated(() => {
//             ref.setValue(null)
//         })
//         onRemount(() => {
//             ref.setValue(component)
//         })
//     }

//     beforeUnmount(() => {
//         ref.setValue(null);
//     })
//     // }
//     ref.markInitialized();
// }


// export function mountComponent(parent: Element, component: InternalComponent) {
//     component.emit(LifecycleHook.BEFORE_MOUNT);
//     parent.append(...component.domNodes);
//     component.emit(LifecycleHook.MOUNTED);
// }

// export function unmountComponent(component: InternalComponent) {
//     component.emit(LifecycleHook.BEFORE_UNMOUNT);
//     // const nodes = component.nodeEntities;
//     // for (const node of nodes) {
//     //     node.remove();
//     // }
//     component.emit(LifecycleHook.UNMOUNTED);
// }


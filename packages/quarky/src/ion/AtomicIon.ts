import { __DEV__label, __DEV__traceMethodCall, emitSignal, Labellable } from "../debug";
import { isIonizedModel, ionize } from "../ionize/ionize";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { trigger } from "../trigger";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { AnyObject } from "@rue/types";
import { AnyIon, Ion, IonMethods, isIon } from "./Ion";
import { ProtectedIon } from "./ReinedIon";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace, Traceable, traceableMethodWrap } from "../debug";

export type AtomicIon<T = any, M extends AnyObject = {}> = (() => T)
   & {
      [META]: MetaIon<T>;
      state: T;
   } & { [K in keyof M]: M[K] } & Labellable


export const ION = Symbol('atomicIon');

export class MetaIon<T = unknown> implements ReactiveEntity {

   type = ION

   asDefaultReined?: ProtectedIon
   asReadonly?: ProtectedIon
   __DEV__asTraceable?: Traceable;

   constructor(
      readonly o: AtomicIon<T>,
      public value: T,
      readonly hasIonicValue: boolean = false,
      public hasMethods: boolean = false,
      public inert = false
   ) {
      if (__DEV__) this.__DEV__asTraceable = new Traceable()
   }

}


export function createAtomicIon<
   T,
   M extends IonMethods
>(
   value: T,
   methods?: M,
   inert?: boolean
) {
   const metaIon = new MetaIon(<AtomicIon>$ion, value, isIonizedModel(value), !!methods, !!inert)

   function $ion() {
      if (inert) return metaIon.value;
      if (__DEV__) emitSignal();
      const tracker = getActiveTracker()
      if (!tracker)
         return metaIon.value as T
      tracker.track(<AtomicIon>$ion)
      return metaIon.value as T;
   }

   $ion[META] = metaIon
   $ion.__DEV__labelName = undefined
   $ion.__DEV__label = __DEV__label

   Object.defineProperty($ion, 'state', {
      get() {
         return metaIon.value //TODO: not sure if this should allow tracking or not by calling $ion()
      },
      set(value: T) {
         setValue(metaIon, value, metaIon.value);
         __DEV__traceMethodCall('AtomicIon', $ion, 'state')
      }
   })

   if (methods) {
      attachIonMethods('AtomicIon', $ion as Ion, methods)
   }

   return $ion
}

export function attachIonMethods(type: string, ion: Ion, methods: AnyObject) {
   for (const key in methods) {
      //@ts-expect-error
      ion[key]
         = __DEV__ ? traceableMethodWrap(type, ion, key, methods[key]) : methods[key]
   }
   return ion;
}



// ORDER:
// - set value
// - trigger effects (run sync effects, schedule effects)
// - trigger derivations effects (run sync effects, schedule effects)

function setValue(metaIon: MetaIon, newValue: unknown, oldValue: unknown) {
   if (oldValue === newValue) {
      trigger(metaIon.o, newValue, oldValue) // for onTriggered
      return oldValue;
   }

   const $ion = metaIon.o;
   const _newValue = shouldIonize(newValue, metaIon) ? ionize(newValue) : newValue
   // toIonicModelIfMust(newValue, metaIon)
   metaIon.value = _newValue;
   if (!metaIon.inert) trigger($ion, _newValue, oldValue);
   return _newValue;
}

function shouldIonize(newValue: unknown, metaIon: MetaIon): newValue is AnyObject {
   return newValue instanceof Object && metaIon.hasIonicValue;
}



// function attachMethods(methods: { [key: string]: Function }, proto: AnyObject) {
//     for (const key in methods) {
//         proto[key] = function performMethod(...args: any[]) {
//             if (!methodAllowed()) throw new Error("Object is protected from this method")
//             setAllowed = true;
//             const output = methods![methodKey](...args)
//             setAllowed = false;
//             methodKey = "";
//             return output;
//         }
//     }
// }

// function wrapIonMethods(
//     proto: IonPrototype<any, any>,
//     methods: { [key: string]: (...args: any[]) => any },
//     mutate: (...args: any[]) => any
// ) {
//     for (const key in methods) {
//         proto[key] = wrapIonMethod(methods[key])
//     }
// }

// function wrapIonMethod(method: Function, key: string) {
//     return function performMethod(...args: any[]) {
//         if (!methodAllowed()) throw new Error("Object is protected from this method")
//         setAllowed = true;
//         const output = methods![methodKey](...args)
//         setAllowed = false;
//         methodKey = "";
//         return output;
//     }
// }






// function set<T>(this: MetaIon, toNewValue: (value: T) => T) {
//     const value = this.value as T;
//     return setValue(this, toNewValue(value), value);
// }


export function isAtomicIon(maybeIon: any): maybeIon is AtomicIon {
   if (maybeIon instanceof Object) return maybeIon[META]?.type === ION;
   return false;
}

export function asMetaIon<T>(ionicEntity: T): T extends { [META]: infer M } ? M : never {
   if (!isIon(ionicEntity)) throw new Error("INVALID INPUT. Must be an ion")
   return ionicEntity[META] as T extends { [META]: infer M } ? M : never
}
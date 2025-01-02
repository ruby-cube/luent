import { emitSignal } from "../debug";
import { isIonizedModel, ionize } from "../ionize/ionize";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { trigger } from "../trigger";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { AnyObject } from "@rue/types";
import { IonMethods, isIon } from "./Ion";
import { ProtectedIon } from "./ReinedIon";

export type AtomicIon<T = any, M extends AnyObject = {}> = (() => T)
   & {
      [META]: MetaIon<T>;
      value: T;
   } & { [K in keyof M]: M[K] } & (M extends { set: any } ? { _set: (value: T) => T } : { set: (value: T) => T })


export const ION = Symbol('atomicIon');

export class MetaIon<T = unknown> implements ReactiveEntity {

   type = ION

   asDefaultReined?: ProtectedIon
   asReadonly?: ProtectedIon

   constructor(
      readonly o: AtomicIon<T>,
      public value: T,
      readonly hasIonicValue: boolean = false,
      public hasMethods: boolean = false,
      public inert = false
   ) { }
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

   const setterKey = methods && ('set' in methods) ? "_set" : 'set'

   const proto = {
      [META]: metaIon,
      get value() {
         return metaIon.value //TODO: not sure if this should allow tracking or not by calling $ion()
      },
      set value(value: T) {
         setIonValue(value)
      },
      [setterKey]: setIonValue

   } as AnyObject

   if (methods) {
      attachIonMethods(proto, methods)
   }

   function setIonValue(newValue: any) {
      return setValue(metaIon, newValue, metaIon.value);
   }

   function $ion() {
      if (inert) return metaIon.value;
      if (__DEV__) emitSignal();
      const tracker = getActiveTracker()
      if (!tracker)
         return metaIon.value as T
      tracker.track(<AtomicIon>$ion)
      return metaIon.value as T;
   }

   Object.setPrototypeOf($ion, proto)

   return $ion as AtomicIon<T, M>
}

export function attachIonMethods(proto: AnyObject, methods: AnyObject) {
   for (const key in methods) {
      proto[key] = methods[key]
   }
   return proto;
}

// ORDER:
// - set value
// - trigger effects (run sync effects, schedule effects)
// - trigger derivations effects (run sync effects, schedule effects)

function setValue(metaIon: MetaIon, newValue: unknown, oldValue: unknown) {
   if (oldValue === newValue) return oldValue;
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

//NOTE: It may be tempting to abstract the TypeDefs into a TypeDef with Generics, but because typescript
// does not have higher order generics, this is not currently possible. Must manually type them all.

import { AnyObject } from "@rue/types";

// export type _Nonlocal<T> = T extends object
//   ? T extends Function
//     ? T
//     : Nonlocal<T>
//   : T;
export type _Nonlocal<T> = T extends (...args: any[]) => void ? T :
   T extends () => infer V ? (V extends Object ? (() => Nonlocal<V>) : () => V) & Nonlocal<T> :
   // T extends PropertyValuesOf<NonLocalDataStructures<T>>['structure'] ? PropertyValuesOf<NonLocalDataStructures<T>>['nonLocal'] :
   T extends Object ? Nonlocal<T>
   : T

// export type _Nonlocal<T> = T extends Function ? T : T extends object ? Nonlocal<T> : T

export type Nonlocal<T> =
   // T extends () => infer V ? () => _Nonlocal<V> & {
   //    readonly [K in keyof T]: _Nonlocal<T[K]>
   // } :
   T extends PropertyValuesOf<NonLocalDataStructures<T>>['structure'] ? PropertyValuesOf<NonLocalDataStructures<T>>['nonLocal'] :
   T extends Object ? {
      readonly [K in keyof T]: _Nonlocal<T[K]>
   }
   : T

//ARRAY ONLY
// type WithMethods<S, DepthTracker extends any[] = []> = 
// { readonly [K in keyof S as S[K] extends number ? never : K]: S[K] extends Function ? S[K] : LimitedNonlocal<S[K], DepthTracker> }

type AsNonlocal<T> = {
   readonly [K in keyof T]: T[K] extends Function ? T[K] : _Nonlocal<T[K]>
}



// type LimitedNonlocal<T, DepthTracker extends any[] = []> = DepthTracker['length'] extends 8 ? T : _Nonlocal<T, [...DepthTracker, any]>

interface NonLocalDataStructures<T> {
   Array: {
      structure: Array<any>,
      nonLocal: T extends Array<infer E> ? readonly (_Nonlocal<E>)[]
      // :never
      & ArrayMethods<Array<_Nonlocal<E>>> : never
   }
}

type ArrayMethods<T> = Omit<T, number>

interface NonLocalDataStructures<T> {
   Set: {
      structure: Set<any>,
      nonLocal: T extends Set<infer E> ? AsNonlocal<Set<_Nonlocal<E>>> : never
   }
}
interface NonLocalDataStructures<T> {
   Map: {
      structure: Map<any, any>,
      nonLocal: T extends Map<infer E, infer V> ? AsNonlocal<Map<_Nonlocal<E>, _Nonlocal<V>>> : never
   }
}

type PropertyValuesOf<T> = T[keyof T];



//EXAMPLES
// const mySet = new Set([{ pi: 0 }])
// type H<T> = T extends PropertyValuesOf<NonLocalDataStructures<T>>['structure'] ? PropertyValuesOf<NonLocalDataStructures<T>>['nonLocal'] : 'no'
// type Answer = Nonlocal<typeof mySet>

// const apple: Answer = new Set();
// apple.add({ pi: 8 })

// const array: Nonlocal<{ pi: number }[]> = []

// array[0] = { pi: 8 }
// const e = array.pop()
// const el = array.splice(0, 1)


export type MaybeIon<T> = (($?: any) => T) | T

export const v = ((optional?: '?' | '??') => {
   if (optional === '??')
      return function v(defaultValue: any) {
         return {
            name: 'v',
            optional: 'withDefault',
            default: defaultValue
         }
      }
   return {
      name: v,
      optional,
   };
}) as {
   <T>(optional?: '?' | '??'): {
      name: 'v',
      validatedType: T;
      inputType: T;
      optional: '?';
      default: undefined
   } & ((defaultValue: T) => {
      name: 'v',
      validatedType: T;
      inputType: T;
      optional: 'withDefault';
      default: true;
   }),
   name: 'v';
   required: true;
}



export const z = ((optional?: '?' | '??') => {
   if (optional === '??')
      return function z(defaultValue: any) {
         return {
            name: 'z',
            optional: 'withDefault',
            default: defaultValue
         }
      }
   return {
      name: z,
      optional,
   };
}) as {
   <T>(optional?: '?' | '??'): {
      name: 'z',
      validatedType: T;
      inputType: T;
      optional: '?';
      default: undefined
   } & ((defaultValue: T) => {
      name: 'z',
      validatedType: T;
      inputType: T;
      optional: 'withDefault';
      default: true;
   }),
   name: 'z';
   required: true;
}

// const _Ion = ((optional: '?') => {
//    return {
//       name: '_Ion',
//       optional,
//       default: undefined
//    }
// }) as {
//    <T, M extends AnyObject = {}>(optional: '?'): {
//       name: '_Ion',
//       validatedType: Ion<T, M>; //TODO: need a way to indicate methods are required...
//       inputType: Ion<T, M> | T;
//       optional: '?';
//       default: undefined
//    },
//    name: '_Ion';
//    required: true;
// }


export const MaybeIon = ((optional: '?' | '??') => {
   if (optional === '??')
      return function MaybeIon(defaultValue: any) {
         return {
            name: 'MaybeIon',
            optional: 'withDefault',
            default: defaultValue
         }
      }
   return {
      name: 'MaybeIon',
      optional
   }
}) as {
   <T, M extends AnyObject = {}>(optional?: '?'): {
      name: 'MaybeIon',
      validatedType: Ion<T, M>;
      inputType: Ion<T, M> | T;
      optional: '?';
      default: undefined
   } & ((defaultValue: T) => {
      name: 'MaybeIon',
      validatedType: Ion<T, M>;
      inputType: Ion<T, M> | T;
      optional: 'withDefault';
      default: true;
   }),
   name: 'MaybeIon';
   required: true;
}
export { MaybeIon as Ion }
type Ion<T = any, M extends AnyObject = {}> = (() => T) & M
// export const $Ion = ((optional: '?') => {
//    return {
//       name: '$Ion',
//       optional,
//       default: undefined
//    }
// }) as {
//    <T, M extends AnyObject>(optional: '?'): {
//       name: '$Ion',
//       validatedType: Ion<T, M>;
//       $attributeType: Ion<T, M>;
//       optional: '?'
//       default: undefined
//    },
//    name: '$Ion';
//    required: true;
// }


// export const $Ref = ((optional: '?') => {
//    return {
//       name: '$Ref',
//       optional,
//       default: undefined
//    }
// }) as {
//    <T, M extends AnyObject>(optional: '?'): {
//       name: '$Ref',
//       validatedType: Ion<T, M>;
//       $attributeType: Ion<T, M>;
//       optional: '?'
//       default: undefined
//    },
//    name: '$Ref';
//    required: true;
// }

// export const $IonOrIon = ((optional: '?') => {
//    return {
//       name: '$IonOrIon',
//       optional,
//       default: undefined
//    }
// }) as {
//    <T, M extends AnyObject>(optional: '?'): {
//       name: '$IonOrIon',
//       validatedType: Ion<T> | Ion<T, M>;
//       inputType: Ion<T> | T;
//       $attributeType: Ion<T, M>;
//       optional: '?'
//       default: undefined
//    },
//    name: '$IonOrIon';
//    required: true;
// }

// export type Ionized<T extends AnyObject, M = {}> = {
//    [K in keyof T]: T[K] extends AtomicIon<infer V> | DerivedIon<infer V> | WritableDerivedIon<infer V> ? V : T[K]
// } & M & { [META]: MetaIonizedModel }

// const _Ionized = ((optional: '?') => {
//    return {
//       name: '_Ionized',
//       optional,
//       default: undefined
//    }
// }) as {
//    <T extends AnyObject>(optional: '?'): {
//       name: '_Ionized',
//       validatedType: T;
//       inputType: T;
//       optional: '?';
//       default: undefined
//    },
//    name: '_Ionized';
//    required: true;
// }
// export { _Ionized as Ionized }



export const MaybeIonized = ((optional?: '?' | '??') => {
   if (optional === '??')
      return function MaybeIonized(defaultValue: any) {
         return {
            name: 'MaybeIonized',
            optional: 'withDefault',
            default: defaultValue
         }
      }
   return {
      name: 'MaybeIonized',
      optional,
   }
}) as {
   <T extends AnyObject>(optional?: '?' | '??'): {
      name: 'MaybeIonized',
      validatedType: T;
      inputType: T;
      optional: '?';
      default: undefined
   } & ((defaultValue: T) => {
      name: 'MaybeIonized',
      validatedType: T;
      inputType: T;
      optional: 'withDefault';
      default: true;
   }),
   name: 'MaybeIonized';
   required: true;
}

export { MaybeIonized as Ionized }
// export const $Ionized = ((optional: '?') => {
//    return {
//       name: '$Ionized',
//       optional,
//       default: undefined
//    }
// }) as {
//    <T extends AnyObject, M>(optional: '?'): {
//       name: '$Ionized',
//       validatedType: Ionized<T, M>;
//       $attributeType: Ionized<T, M>;
//       optional: '?'
//       default: undefined
//    },
//    name: '$Ionized';
//    required: true;
// }

// export const $IonizedOrIonized = ((optional: '?') => {
//    return {
//       name: '$IonizedOrIonized',
//       optional,
//    }
// }) as {
//    <T extends AnyObject, M>(optional: '?'): {
//       name: '$IonizedOrIonized',
//       validatedType: Ionized<T, M> | Ionized<T>;
//       inputType: Ionized<T>;
//       $attributeType: Ionized<T, M>;
//       optional: '?'
//       default: undefined
//    },
//    name: '$IonizedOrIonized'
//    required: true;
// }



export function pure<F extends (...args: any[]) => any>(fn: F): ReturnType<F> extends void ? F : Pure<F> {
   return fn as ReturnType<F> extends void ? F : Pure<F>
}

export type Pure<Fn extends Function> = Fn & { [_PURE_]: true }

const _PURE_ = Symbol('pure function marker')


/**
 * Types all properties as readonly and hides any function that is not marked pure.
 * Deep read-only--Makes any nested objects read-only as well.
 **/
export type DeepReadonly<T> = T extends Function ? T : T extends (infer E)[] ? readonly DeepReadonly<E>[] : T extends Object ? Readonly<T> : T;


type Readonly<T> = {
   readonly [K in keyof T
   as T[K] extends { [_PURE_]: true } ? K
   : T extends { '~pure'?: infer P } ? K extends P ? T[K] extends (...args: any[]) => any ? ReturnType<T[K]> extends void ? never : K : K : T[K] extends Function ? never : K
   : T[K] extends Function ? never : K]: DeepReadonly<T[K]>
}

export type NonVoidMethods<T, K extends keyof Partial<NonVoidMethodsOnly<T>>> = K

type NonVoidMethodsOnly<T> = {
   [K in keyof T as T[K] extends (...args: any[]) => any ? ReturnType<T[K]> extends void ? never : K : never]: T[K]
}

//TODO: exclude mutating methods, but type getter methods such that they return readonly
interface ReadonlyCollections<T> {
   Array: {
      collection: Array<any>,
      readonly: T extends Array<infer E> ? readonly (DeepReadonly<E>)[]
      // :never
      & ArrayMethods<Array<DeepReadonly<E>>> : never
   }
}

interface ReadonlyCollections<T> {
   Set: {
      collection: Set<any>,
      readonly: T extends Set<infer E> ? AsReadonly<Set<DeepReadonly<E>>> : never
   }
}

type AsReadonly<T> = {
   readonly [K in keyof T]: T[K] extends Function ? T[K] : DeepReadonly<T[K]>
}


class Dog {
   food!: {
      kibble: true
   }

   constructor() {

   }

   getFood() {
      return this.food
   }
}

interface Dog {
   '~pure'?: NonVoidMethods<Dog, 'getFood'>;
   '~getters'?: {
      getFood(): Readonly<Dog['food']>
   }
}


function hey(dog: Readonly<Dog>) {
   const foodB = dog.food
   const food = dog.getFood()
}

// type TypedReturn<T, K extends keyof T> = T[K] extends (...args: infer P) => infer R ? (this: Readonly<T>, ...args: P) => ReturnType<Readonly<T>[K]> : never

// type GetFood = TypedReturn<Dog, 'getFood'>

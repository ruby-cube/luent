
//NOTE: It may be tempting to abstract the TypeDefs into a TypeDef with Generics, but because typescript
// does not have higher order generics, this is not currently possible. Must manually type them all.

import { AtomicIon, DerivedIon, ion, WritableDerivedIon } from "@rue/quarky";
import { AnyObject } from "@rue/types";
import { MetaIonizedModel } from "../../quarky/src/ionize/MetaIonizedModel";
import { META } from "../../quarky/src/ReactiveEntity";

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

type Readonly<T> = T extends (infer E)[] ? readonly E[] : {
   readonly [K in keyof T]: T[K]
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


export type MaybeGetter<T> = (() => T) | T

export const v = ((optional: '?') => {
   function v(defaultValue: any) {
      return {
         name: 'v',
         optional: 'withDefault',
         default: defaultValue
      }
   }
   v.optional = optional
   return v
}) as {
   <T>(optional?: '?'): {
      name: 'v',
      validatedType: _Nonlocal<T>;
      inputType: T;
      optional: '?';
      default: undefined
   } & ((defaultValue: T) => {
      name: 'v',
      validatedType: _Nonlocal<T>;
      inputType: T;
      optional: 'withDefault';
      default: true;
   }),
   name: 'v';
   required: true;
}

const _Ion = ((optional: '?') => {
   return {
      name: '_Ion',
      optional,
      default: undefined
   }
}) as {
   <T, M extends AnyObject = {}>(optional: '?'): {
      name: '_Ion',
      validatedType: _Nonlocal<Ion<T, M>>; //TODO: need a way to indicate methods are required...
      inputType: Ion<T, M> | T;
      optional: '?';
      default: undefined
   },
   name: '_Ion';
   required: true;
}
export { _Ion as Ion }
export type Ion<T = any, M extends AnyObject = {}> = (() => T) & M


// const _Ref = ((optional: '?') => {
//    return {
//       name: '_Ref',
//       optional,
//       default: undefined
//    }
// }) as {
//    <T>(optional: '?'): {
//       name: '_Ref',
//       validatedType: Ref<T>;
//       inputType: Ref<T> | T;
//       optional: '?';
//       default: undefined
//    },
//    name: '_Ref';
//    required: true;
// }
// export { _Ref as Ref }
// export type Ref<T = any, M extends AnyObject = {}> = (() => T)  & M


export const MaybeIon = ((optional: '?') => {
   function MaybeIon(defaultValue: any) {
      return {
         name: 'MaybeIon',
         optional: 'withDefault',
         default: defaultValue
      }
   }
   MaybeIon.optional = optional
   return MaybeIon
}) as {
   <T>(optional?: '?'): {
      name: 'MaybeIon',
      validatedType: _Nonlocal<Ion<T>>;
      inputType: Ion<T> | T;
      optional: '?';
      default: undefined
   } & ((defaultValue: T) => {
      name: 'MaybeIon',
      validatedType: _Nonlocal<Ion<T>>;
      inputType: Ion<T> | T;
      optional: 'withDefault';
      default: true;
   }),
   name: 'MaybeIon';
   required: true;
}

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

export type Ionized<T extends AnyObject, M = {}> = {
   [K in keyof T]: T[K] extends AtomicIon<infer V> | DerivedIon<infer V> | WritableDerivedIon<infer V> ? V : T[K]
} & M & { [META]: MetaIonizedModel }

const _Ionized = ((optional: '?') => {
   return {
      name: '_Ionized',
      optional,
      default: undefined
   }
}) as {
   <T extends AnyObject>(optional: '?'): {
      name: '_Ionized',
      validatedType: _Nonlocal<T>;
      inputType: T;
      optional: '?';
      default: undefined
   },
   name: '_Ionized';
   required: true;
}
export { _Ionized as Ionized }



export const MaybeIonized = ((optional: '?') => {
   function MaybeIonized(defaultValue: any) {
      if (optional === '?') throw new Error('Cannot provide default')
      return {
         name: 'MaybeIonized',
         optional: 'withDefault',
         default: defaultValue
      }
   }
   MaybeIonized.optional = optional
   return MaybeIonized
}) as {
   <T extends AnyObject>(optional?: '?'): {
      name: 'MaybeIonized',
      validatedType: _Nonlocal<T>;
      inputType: T;
      optional: '?';
      default: undefined
   } & ((defaultValue: T) => {
      name: 'MaybeIonized',
      validatedType: _Nonlocal<T>;
      inputType: T;
      optional: 'withDefault';
      default: true;
   }),
   name: 'MaybeIonized';
   required: true;
}


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


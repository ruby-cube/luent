
//NOTE: It may be tempting to abstract the TypeDefs into a TypeDef with Generics, but because typescript
// does not have higher order generics, this is not currently possible. Must manually type them all.

import { AnyObject, UnionToIntersection } from "@rue/types";


// [ ] Configure type with key
//     - fromTag()
//     - CommonsKey()
//
// [ ] Validate type via typescript
//     - $M()
//     - index.d.ts
// 
// [ ] Runtime validation and normalization of reactive type. Defaults
//     - fromTag()
//     - fromCommons()
// 
// [ ] Read-only and Reined conversion
//     - fromTag()
//     - fromCommons()
//     - ref()
// 
// [ ] m: and mu: validation
//     - fromTag()
//     - fromCommons()

export type MaybeIon<T> = T | Ion<T>

export type _Nonlocal<T> = T extends (...args: any[]) => void ? T :
   T extends () => infer V ? (V extends Object ? (() => Nonlocal<V>) : () => V) & Nonlocal<T> :
   T extends Object ? Nonlocal<T>
   : T

export type Nonlocal<T> =
   T extends PropertyValuesOf<NonLocalDataStructures<T>>['structure'] ? PropertyValuesOf<NonLocalDataStructures<T>>['nonLocal'] :
   T extends Object ? { readonly [K in keyof T]: _Nonlocal<T[K]> }
   : T

//ARRAY ONLY
// type WithMethods<S, DepthTracker extends any[] = []> = 
// { readonly [K in keyof S as S[K] extends number ? never : K]: S[K] extends Function ? S[K] : LimitedNonlocal<S[K], DepthTracker> }

type AsNonlocal<T> = {
   readonly [K in keyof T]: T[K] extends Function ? T[K] : _Nonlocal<T[K]>
}

const OPTIONAL = '?' as const
type Optional = typeof OPTIONAL



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

// type TypeConfig = {
//    name: string,
//    validatedType?: any,
//    inputType?: any,
//    default?: true | undefined;
//    required?: true;
//    optional?: '?' | 'withDefault'
// }

type MaybeDefaultType<T, D> = unknown extends T ? D : T






export const v = ((optional?: Optional) => {
   function v(defaultValue: any) {
      return {
         name: 'v',
         optional: 'withDefault',
         default: defaultValue
      }
   }
   v.optional = OPTIONAL
   return v;
}) as {
   <T>(optional?: Optional): {
      name: 'v',
      validatedType: T;
      inputType: T;
      optional: Optional;
      default: undefined
   } & (<D>(defaultValue: MaybeDefaultType<T, D>) => {
      name: 'v',
      validatedType: MaybeDefaultType<T, D>;
      inputType: MaybeDefaultType<T, D>;
      optional: 'withDefault';
      default: true;
   }),
   // } & ((defaultValue: T) => {
   //    name: 'v',
   //    validatedType: T;
   //    inputType: T;
   //    optional: 'withDefault';
   //    default: true;
   // }),
   name: 'v';
   required: true;
}

export const z = ((optional?: Optional) => {
   function z(defaultValue: any) {
      return {
         name: 'z',
         optional: 'withDefault',
         default: defaultValue
      }
   }
   z.optional = OPTIONAL;
   return z
}) as {
   <T>(optional?: Optional): {
      name: 'z',
      validatedType: T;
      inputType: T;
      optional: Optional;
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


export const ToIon = ((optional: Optional) => {
   function ToIon(defaultValue: any) {
      return {
         name: 'ToIon',
         optional: 'withDefault',
         default: defaultValue
      }
   }
   ToIon.optional = OPTIONAL;
   return ToIon
}) as {
   <T, M extends AnyObject = {}>(optional?: Optional): {
      name: 'ToIon',
      validatedType: Ion<T, M>;
      inputType: Ion<T, M> | T;
      optional: Optional;
      default: undefined
   } & ((defaultValue: T) => {
      name: 'ToIon',
      validatedType: T extends Ion<infer S, infer F> ? Ion<S, F> : T;
      inputType: T extends Ion<infer S, infer F> ? Ion<S, F> : T;
      optional: 'withDefault';
      default: true;
   }),
   name: 'ToIon';
   required: true;
}
export { ToIon as Ion }
type Ion<T = any, M extends AnyObject = {}> = (() => T) & M


export const ToIonized = ((optional?: Optional) => {
   function ToIonized(defaultValue: any) {
      return {
         name: 'ToIonized',
         optional: 'withDefault',
         default: defaultValue
      }
   }
   ToIonized.optional = OPTIONAL
   return ToIonized
}) as {
   <T extends AnyObject>(optional?: Optional): {
      name: 'ToIonized',
      validatedType: T;
      inputType: T;
      optional: Optional;
      default: undefined
   } & ((defaultValue: T) => {
      name: 'ToIonized',
      validatedType: T;
      inputType: T;
      optional: 'withDefault';
      default: true;
   }),
   name: 'ToIonized';
   required: true;
}

export { ToIonized as Ionized }




// export function pure<F extends (...args: any[]) => any>(fn: F): ReturnType<F> extends void ? F : Pure<F> {
//    return fn as ReturnType<F> extends void ? F : Pure<F>
// }

// export type Pure<Fn extends Function> = Fn & { [_PURE_]: true }

// const _PURE_ = Symbol('pure function marker')


/**
 * Types all properties as readonly and hides any function that is not marked pure.
 * Deep read-only--Makes any nested objects read-only as well.
 **/
export type DeepReadonly<T> = T extends Function ? T : T extends (infer E)[] ? readonly DeepReadonly<E>[] : T extends Object ? Readonly<T> : T;


export type Readonly<T> = {
   readonly [K in keyof T
   as T[K] extends Function ? never : K]: DeepReadonly<T[K]>
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


export type MutableIon<T> = T & ({ state: unknown } | { set: (value: unknown) => unknown })

export type RequiredInput = { required: true };

// Raw input (vs validated input)
export type Input<C> = C extends (arg: any) => ({ inputType?: infer I }) ? I : C extends { inputType: infer I } ? I : 'invalid typeConfig'

export type OptionalInput<C> = Input<C> | undefined;

export type MutableInput<K extends string, C> = C extends ((arg: any) => { inputType: infer I }) ? K extends `mu:${infer S}` ? I & MutableIon<I> : never : 'invalid typeConfig';

export type OptionalMutableInput<K extends string, C> = MutableInput<K, C> | undefined;


// export type MaybeMutableInput<K extends string, C> = C extends ((arg: any) => { inputType: infer I }) ? K extends `mu?:${infer S}` ? [{ [K in `mu:${S}`]: MutableIon<I> }, { [K in S]: I }] : never : 'invalid typeConfig';
// export type OptionalMaybeMutableInput<K extends string, C> = MutableInput<K, C> | undefined;


// type InferMutableKey<K extends string> = K extends `mu?:${infer S}` ? S : K extends `mu:${infer S}` ? S : never





// type Attributes<C> = {
//    [K in keyof C as C[K] extends { required: true } & ((arg: any) => { inputType: any }) ? K extends `mu?:${string}` ? never : K : never]:
//    C[K] extends ((arg: any) => { inputType: infer I }) ? I : 'invalid typeConfig'
// } & {
//    [K in keyof C as C[K] extends { optional: '?' | 'withDefault', inputType: any } ? K extends `mu?:${string}` ? never : K : never]?:
//    C[K] extends { inputType: infer I } ? I : 'invalid typeConfig'
// } & (WithMaybeMutables<C> extends never ? {} : WithMaybeMutables<C>)

// type WithMaybeMutables<C> = IntersectionOfUnions<UnionToIntersection<(keyof RequiredMaybeMutables<C> extends never ? {} : RequiredMaybeMutables<C>[keyof RequiredMaybeMutables<C>])
//    & (keyof OptionalMaybeMutables<C> extends never ? {} : OptionalMaybeMutables<C>[keyof OptionalMaybeMutables<C>])>>

// type IntersectionOfUnions<T> =
//    // Convert each intersected tuple to a union using distributive conditional types
//    (T extends any[] ? TupleToUnion<T> : never);

// type TupleToUnion<T extends any[]> = T[number];


// type RequiredMaybeMutables<C> = {
//    [K in keyof C as C[K] extends { required: true } & ((arg: any) => { inputType: any }) ? K extends `mu?:${infer S}` ? S : never : never]:
//    C[K] extends ((arg: any) => { inputType: infer I }) ? K extends `mu?:${infer S}` ? [{ [K in `mu:${S}`]: I }, { [K in S]: I }] : never : 'invalid typeConfig'
// }

// type OptionalMaybeMutables<C> = {
//    [K in keyof C as C[K] extends { optional: '?' | 'withDefault', inputType: any } ? K extends `mu?:${infer S}` ? S : never : never]:
//    C[K] extends { inputType: infer I } ? K extends `mu?:${infer S}` ? [{ [K in `mu:${S}`]?: I }, { [K in S]?: I }] : never : 'invalid typeConfig'
// }

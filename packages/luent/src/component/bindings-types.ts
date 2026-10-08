import { ExcludePrimitives, Glass, OnlyPrimitives, Primitive } from "@luent/types";
import { Ion, Ionic } from "@luent/quarky";
import { RawJSXNode } from "../node/makeJSXNode";
import { NodeRef, RefSource } from "../node/NodeRef";
import { LuentHooks } from "../flask/template-hooks";
import { JSX } from "../jsx-runtime"


export type HandleEvent<E = {}> = keyof E extends never ? (() => void) | ((event: E) => void) : (event: E) => void

export type IonOr<T> = T | (() => T)

export type MuPack<T> = { mu: Readonly<T> }
export type Mu<T> = { mu: T }

// { mu?: { user?: User }, user?: User } 
export type MuOr<T extends object, U extends undefined | '?' = undefined> = U extends '?' ? { mu?: Glass<OptionalProperties<T>> } & Glass<OptionalProperties<T>> : { mu: T } & T

type OptionalProperties<T> = { [K in keyof T]?: T[K] }

// interface User {name: string}

// type MuOrUser = MuOr<{user: User}, '?'>


// two types of component input
// - context input
// - tag input

// TODO: Runtime check that only one of either e.g. $message or message attribute is passed in (not both)

// TODO: transform slot render function to Slot component
// Ion<string>  => Ion<string>
// Ion<string, { set: () => void }, 'mu?'>('?')
// Ionized<{}> => Ionized<{}>
// Ion <Ionized<{}>> // object will not be validated as ionized...

type HasEvent<C> = keyof C extends never ? false : Exclude<keyof C, Exclude<keyof C, `on:${string}`>> extends never ? false : true

type WithDOMEvent<C> = { emit: { [K in keyof C as K extends `on:${infer E}` ? E : never]: C[K] } & { [K in keyof DOMEvents<HTMLElement> as K extends `on:${infer E}` ? E : never]: DOMEvents<HTMLElement>[K] } }

type WithEvents<C> = { [K in keyof C as K extends `on${infer Head}${string}` ? Head extends Uppercase<Head> ? K : never : never]: C[K] }
type TagEvents<C> = { [K in keyof C as K extends `on${infer Head}${string}` ? Head extends Uppercase<Head> ? K : never : never]?: C[K] }

type HasMu<C> = keyof C extends never ? false : Exclude<keyof C, Exclude<keyof C, `mu:${string}` | `mu?:${string}`>> extends never ? false : true

export type TagBindings<D> =
  Attributes<D>
  & MutableAttribute<D>
  & TagDOMEvents<D>
  & TagEvents<D>
  & TagSlot<D>
// & TagNamedSlots<D>
// TODO: MaybeMutable<D> mu?:x

// PlainInput<D>
// & MaybeIonAttributes<D>
// & NonmutableIonAttributes<D>
// & { class?: IonOr<string>, style?: IonOr<string> }
// & OpAttribute<D>
// & SeeAttribute<D>
// & (D extends { provide: infer P } ? P : {})
// [] mu ---> {mu:name: MutableIon<string>}
// [] mu? --> {mu:name: MutableIon<string>}  and {frog: IonOr<string>}
// [] Ion --> IonOr<string>
// [] Inert --> 

type Attributes<D> = {
  [K in keyof D as
  K extends 'Slot' | `on:${string}` | `mu:${string}` | `...` ? never
  : K extends `on${infer Head}${string}` ? Head extends Uppercase<Head> ? never : K
  : K]:
  IsIon<D[K]> extends true
  ? D[K] extends Ion<infer S>
  ? S | D[K]
  : IsIon<D[K]> extends true
  ? D[K] extends Ion<infer S> | undefined
  ? S | D[K]
  : D[K]
  : D[K]
  : D[K]
}

// type TagNamedSlots<D> = {
//   [K in keyof D as
//   K extends `Slot:${string}` ? K : never]: D[K]
// }

type TagDOMEvents<D> = {
  [K in keyof D as K extends `on:${string}` ? K : never]: (event: D[K]) => void
}

type TagSlot<D> = D extends { Slot: infer S } ? {
  children: S | RawJSXNode
} : {}



type MutableAttribute<D> = {
  [K in keyof D
  as
  K extends `mu:${string}` ? K
  : K extends `mu?:${infer S}` ? never
  : never
  ]:
  D[K]
  // ToMuIon<ExcludePrimitives<D[K]>> | OnlyPrimitives<D[K]>
}





export type Bindings<N extends RefSource> =  { '~bindings'?: ElementAttributes<N> & { ref?: NodeRef<N> } }

// export type FromTag<D = {}> = _FromTag<D>

export type FromTag<D = {}> =
  PlainInput<D>
  & ReadonlyIonInput<D>
  & WithDOMEvent<D>
  & WithEvents<D>
  & WithMu<D>
  // & WithSlot<D>
  & Styles
  & { '~bindings'?: TagBindings<D> }

// type ForwardedBindings<D> = D extends { '...': infer T } ? T extends RefSource ? Bindings<T> : {} : {}


type ElementAttributes<D> =
  D extends keyof JSX.IntrinsicElements ? Omit<JSX.IntrinsicElements[D], 'ref' | keyof LuentHooks<any>> : {} // TODO: use Attributes from index.d.ts

type Styles = {
  styles: Ionic<JSX.CSSProperties>
}

type WithMu<D> = HasMu<D> extends true ? {
  mu: {
    [K in keyof D as K extends `mu:${infer N}` ? N : K extends `mu?:${infer M}` ? M : never]: IsIon<D[K]> extends true ? D[K] extends Ion<infer V> ? V : D[K] : D[K]
  } & {
    // ion access
    [K in keyof D as K extends `mu:${infer N}` ? IsIon<D[K]> extends true ? D[K] extends Ion<any> ? `$${N}` : K extends `mu?:${infer M}` ? IsIon<D[K]> extends true ? D[K] extends Ion<any> ? `$${M}` : never : never : never : never : never]: IsIon<D[K]> extends true ? D[K] extends Ion<infer V> ? D[K] & { value: V } : never : never
  }
} : {}


type PlainInput<D> = {
  [K in keyof D as K extends `...` | `mu:${string}` | `can:${string}` | `on:${string}`/*  | 'provide' */ ? never
  : K]: D[K]
}


export type RenderTag<T = undefined> = T extends undefined ? () => RawJSXNode : (setup: FromTag<T>) => RawJSXNode

type IncludesIon<T> = Exclude<T, Primitive> extends never ? false : IsIon<Exclude<T, Primitive>>


type IsIon<T> = "~ion" extends keyof T ? true : false

type ReadonlyIonInput<D> = {
  [K in keyof D
  as IncludesIon<D[K]> extends true ?
  K extends `...` | `mu:${string}` | `on:${string}` | 'Slot' ? never
  : K extends string ? `$${K}`
  : never
  : never
  ]:
  ExcludePrimitives<D[K]> | OnlyPrimitives<D[K]>
}





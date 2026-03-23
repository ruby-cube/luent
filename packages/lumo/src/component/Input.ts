import { AnyObject, ExcludePrimitives, OnlyPrimitives, Primitive, UnionToIntersection } from "@rue/types";
import { Ion, Ionic, isIon, isIonicProxy, isIonKey, MutableIon, toIon, toValue, } from "@rue/quarky";
import { debug, isFunction, isObject } from "@rue/utils";
import { RawJSXNode } from "../node/makeJSXNode";
import { NodeRef, RefSource } from "../node/NodeRef";


//NOTE: It may be tempting to abstract the TypeDefs into a TypeDef with Generics, but because typescript
// does not have higher order generics, this is not currently possible. Must manually type them all.

export type HandleEvent<E = {}> = keyof E extends never ? (() => void) | ((event: E) => void) : (event: E) => void

export const MU_IONS = 'mu_ions'

export const MU = Symbol('mu')

// export const [getActiveMuIons, muIonsStack] = AsyncState<Set<Ion>>(MU_IONS)

export function assertMutableIon(value: unknown): asserts value is MutableIon<unknown> {
   if (!(isIon(value) && 'value' in value)) throw new Error('[INVALID INPUT] attributes prefixed with mu: must receive a mutable ion or ionic proxy')
}

export function assertIonicProxy(value: unknown): asserts value is MutableIon<unknown> {
   if (!isIonicProxy(value)) throw new Error('[INVALID INPUT] attributes prefixed with mu: must receive a mutable ion or ionic proxy')
}



export type MaybeIon<T> = T | (() => T)


/**
 * Types all properties as readonly and hides any function that is not marked pure.
 * Deep read-only--Makes any nested objects read-only as well.
 **/
export type DeepReadonly<T> = T extends Function ? T : T extends (infer E)[] ? readonly DeepReadonly<E>[] : T extends Object ? Readonly<T> : T;


export type Readonly<T> = {
   readonly [K in keyof T
   as T[K] extends Function ? never : K]: DeepReadonly<T[K]>
}

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

type WithEmit<C> = { emit: { [K in keyof C as K extends `on:${infer E}` ? E : never]: C[K] } & { [K in keyof DOMEvents<HTMLElement> as K extends `on:${infer E}` ? E : never]: DOMEvents<HTMLElement>[K] } }


// C extends AnyObject ? HasEvent<C> extends true ? {
//    emit: {[K in C[`on:${string}`]: C[] ]}
//    // <K extends EventNames<C>>(...event: WithEventObject<K, C[`on:${K}`]>) => void
// } : {} : {}



type WithEventObject<K, F> = F extends () => void ? [K] : F extends (arg: infer A) => any ? [K, A] : never

// keyof E extends never ? (() => void) | ((event: E) => void) : (event: E) => void

type EventNames<C> = keyof EventsOnly<C>

type EventsOnly<C> = { [K in keyof C as K extends `on:${infer S}` ? S : never]: C[K] }

type HasMu<C> = keyof C extends never ? false : Exclude<keyof C, Exclude<keyof C, `mu:${string}` | `mu?:${string}`>> extends never ? false : true

/** TYPE TESTS
 * 
 * const exampleConfig = {
 *    dove: v<Dove>,
 *    // 'mu:frogA': v<Frog>,
 *    'mu?:frog': v<Frog>,
 *    'mu?:well': v<Well>,
 *    // 'mu:wellB': v<Well>
 * } // TODO: Mutable Ions with state and set
 * 
 * type Frog = { name: string }
 * type Well = { depth: number }
 * type Dove = { distance: number }
 * 
 * type ExampleRequired = {
 *    'mu:frog': Frog
 * } | {
 *    frog: Frog
 * }
 * 
 * type ExampleOptional = {
 *    'mu:frog'?: Frog
 * } | {
 *    frog?: Frog
 * }
 * 
 * type Res = ComponentAttributes<typeof exampleConfig>
 * 
 * function tryIt(input: Res) {
 * 
 * }
 * 
 * const f = null as unknown as Frog
 * const w = null as unknown as Well
 * const d = null as unknown as Dove
 * 
 * tryIt({ "mu:frog": f, dove: d, "mu:well": w })
 * tryIt({ frog: f, dove: d, "mu:well": w })
 * tryIt({ "mu:frog": f, dove: d, well: w })
 * tryIt({ frog: f, dove: d, well: w })
 * 
 * //@ts-expect-error
 * tryIt({ "mu:frog": f, dove: d })
 * 
 * //@ts-expect-error
 * tryIt({ dove: d, "mu:well": w })
 * 
 * //@ts-expect-error
 * tryIt({ frog: f, dove: d })
 * 
 * //@ts-expect-error
 * tryIt({ dove: d, well: w })
 * 
 */




// export function fromTag<C>(): FromTag<C> {
//    // C extends {} ? { [K in keyof ComponentValidatedInput<C>]: ComponentValidatedInput<C>[K] } & { [ATTRIBUTES]: C extends undefined ? AnyObject : ComponentAttributes<C> } : AnyObject {
//    const attributes = getComponentAttributes()
//    if (!attributes) throw new Error(`input function must be called as default parameter of component factory`)
//    return toInput(attributes) as FromTag<C>
//    // return prep(attributes, typeConfig) as C extends {} ? ComponentValidatedInput<C> & { [ATTRIBUTES]: C extends undefined ? AnyObject : ComponentAttributes<C> } : AnyObject
// }

function assertFunction(value: unknown) {
   if (!isFunction(value) || isIon(value)) throw new Error('Must be a function')
}

// TODO: Slots
// function getMuIons(attributes: AnyObject) {
//    const muIons: Set<Ion> = new Set()
//    for (const key in attributes) {
//       if (key.startsWith('mu:')) {
//          const value = attributes[key]
//          assertMutableIon(value)
//          muIons.add(value)
//       }
//    }
//    return muIons
// }



export function toInput(attributes: AnyObject, events: AnyObject) {
   // TODO: write a linter that disallows mutation unless variable comes from a property or nested property of the mu object
   // TODO: also provide a input transform helper for non-component functions that mutate arguments
   const mu = new Proxy(attributes, {
      get(target, key) {
         if (typeof key !== 'string') return undefined
         if (isIonKey(key)) {
            const muKey = 'mu:' + key
            if (muKey in target) {
               const value = target[muKey]
               assertMutableIon(value)
               return value
            }
            return undefined
         }
         const muKey = 'mu:' + key
         if (muKey in target) {
            const value = target[muKey]
            if (isIon(value)) {
               assertMutableIon(value)
               return value()
            }
            return value
         }
         return undefined
      },
      set(target, key, value) {
         if (typeof key !== 'string')
            return false
         if (isIonKey(key)) {
            return false
         }
         const muKey = 'mu:' + key
         if (muKey in target) {
            const ion = target[muKey]
            if (isIon(ion)) {
               assertMutableIon(ion)
               ion.value = value
               return true
            }
            return false;
         }
         return false
      }
   })

   return new Proxy(attributes, {
      get(target, key) {
         if (key === 'æclasses') {
            return toIon(attributes.classes)
         }
         if (key === 'æstyles') {
            return toIon(attributes.styles)
         }
         if (key === 'mu') return mu
         if (typeof key !== 'string') return undefined;
         if (key === 'emit') return events;
         if (key === '_raw_') return { ...attributes };
         if (key === 'Slot') return target.Slot // TODO: Is this correct??
         if (isIonKey(key)) {
            const ionKeyToAttributeKey = (key: string) => key.slice(1)
            const attributeKey = ionKeyToAttributeKey(key)
            if (attributeKey in target) {
               const value = target[attributeKey]
               return toIon(value);
            }
            return undefined; // optional
         }
         if (key in target) {
            return target[key]
         }
         return undefined
      },
      set() {
         debug.error('Cannot mutate component input object')
         return false;
      },
      has(target, key) {
         return key in target; // TODO:
      }
   })
}


type TagAttributes<D> =
   Attributes<D>
   // StaticInput<D>
   // & MaybeIonAttributes<D>
   & MutableIonAttributes<D>
   // & NonmutableIonAttributes<D>
   & TagEvents<D>
   // & { class?: MaybeIon<string>, style?: MaybeIon<string> }
   // & OpAttribute<D>
   // & SeeAttribute<D>
   & TagSlot<D>
// & (D extends { provide: infer P } ? P : {})
// [] mu ---> {mu:name: MutableIon<string>}
// [] mu? --> {mu:name: MutableIon<string>}  and {frog: MaybeIon<string>}
// [] Ion --> MaybeIon<string>
// [] Inert --> 

type Attributes<D> = {
   [K in keyof D as K extends 'Slot' ? never : K extends `on:${string}` ? never : K extends `mu:${string}` ? never : K]: D[K] extends Ion<infer S> ? S | D[K] : D[K]
}

type TagEvents<D> = {
   [K in keyof D as K extends `on:${string}` ? K : never]: (event: D[K]) => void
}

type TagSlot<D> = D extends { Slot: infer S } ? {
   children?: (() => RawJSXNode) | RawJSXNode
} : { children?: (() => RawJSXNode) | RawJSXNode }


type MaybeIonAttributes<D> = {
   [K in keyof D
   as IncludesIon<D[K]> extends true ?
   K extends `mu:${string}` ? never
   : K extends `mu?:${infer I}` ? I
   : K extends `on:${string}` | 'Slot' ? never
   : K extends string ? K
   : never
   : never]: D[K]
   // D[K] extends Ion<infer T> ? T | D[K] : D[K]
   // (ExcludePrimitives<D[K]>) |
   // (ExcludePrimitives<D[K]> extends Ion<infer S> ?
   //    S
   //    // MaybeMarkInert<S>
   //    : never)
   // | (OnlyPrimitives<D[K]>)
}
// type NonmutableIonAttributes<D> = {
//    [K in keyof D
//    as IncludesIon<D[K]> extends true ?
//    K extends `mu:${infer I}` ? never
//    :K extends `mu?:${infer I}` ? never
//    : never
//    : never]?:
//    (ExcludePrimitives<D[K]>) |
//    (ExcludePrimitives<D[K]> extends Ion<infer S> ?
//       S
//       // MaybeMarkInert<S>
//       : never)
//    | (OnlyPrimitives<D[K]>)
// }

type MutableIonAttributes<D> = {
   [K in keyof D
   as IncludesIon<D[K]> extends true ?
   K extends `mu:${string}` ? K
   : K extends `mu?:${infer S}` ? `mu:${S}`
   : never
   : never]?:
   ToMuIon<ExcludePrimitives<D[K]>> | OnlyPrimitives<D[K]>
}


type ToMuIon<T> = ExcludePrimitives<T> extends { value: any } ? T
   : keyof IonMethods<T> extends never ?
   T extends Ion<infer S> ? MutableIon<S/* MaybeMarkInert<S> */> : never
   : T extends Ion<infer S> ? MutableIon<S/* MaybeMarkInert<S> */> & IonMethods<T> : never


// type Froggy = {hi: true} | 'div'

// type What = FromTag<Froggy>

// TODO: only allow 'mu:' for ions

export type FromTag<T = {}, D = {}> =
   T extends RefSource
   ? _FromTag<ElementAttributes<T> & D> & { ref?: NodeRef<T> } : _FromTag<T>

export type _FromTag<D> =
   StaticInput<D>
   & ReadonlyIonInput<D>
   & WithEmit<D>
   & WithMu<D>
   & (D extends { Slot: infer S } ? { Slot: S } : {})
   & Styles
   & { '~attributes'?: TagAttributes<D> }


type ElementAttributes<D> =
   D extends 'input' ? { value: any, type: any } : {}

type Styles = {
   styles: Ionic<CSSStyleDeclaration>
   æclasses: Ion<string>,
}

type WithMu<D> = HasMu<D> extends true ? {
   mu: {
      [K in keyof D as K extends `mu:${infer N}` ? N : K extends `mu?:${infer M}` ? M : never]: D[K] extends Ion<infer V> ? V : D[K]
   } & {
      // ion access
      [K in keyof D as K extends `mu:${infer N}` ? D[K] extends Ion<any> ? `æ${N}` : K extends `mu?:${infer M}` ? D[K] extends Ion<any> ? `æ${M}` : never : never : never]: D[K] extends Ion<infer V> ? D[K] & { value: V } : never
   }
} : {}


type StaticInput<D> = {
   [K in keyof D as K extends `mu:${string}` /* | `can:${string}` | `see:${string}`  */ | `on:${string}` | 'Slot'/*  | 'provide' */ ? never
   : K]: D[K] extends Ion<infer V> ? V
   :
   D[K]
}

type IncludesIon<T> = Exclude<T, Primitive> extends never ? false : Exclude<T, Primitive> extends Ion ? true : false

type ReadonlyIonInput<D> = {
   [K in keyof D
   as IncludesIon<D[K]> extends true ?
   K extends `mu:${string}` | `on:${string}` | 'Slot' ? never
   : K extends string ? `æ${K}`
   : never
   : never
   ]:
   ExcludePrimitives<D[K]> | OnlyPrimitives<D[K]>
}



// type MutableIonInput<D> = {
//    [K in keyof D
//    as   IncludesIon<D[K]> extends true ?
//    K extends `mu:${infer I}` ? `æ${I}`
//    : never
//    : never]:
//    (NonlocalIon<ExcludePrimitives<D[K]>> & { '~mu:': true } | OnlyPrimitives<D[K]>)
// }

// type AsMuIon<I> = ExcludePrimitives<I> extends { '~mu:': true } ? MuIon<I>
//    : ExcludePrimitives<I> extends { '~mu:': boolean } ? MuIon<I> | undefined
//    : undefined





type NonlocalIon<T> =
   keyof IonMethods<T> extends never ?
   // T extends Ion<infer S> ? Ion<MaybeMarkInert<S>> : never
   T
   : T extends Ion<infer S> ? Ion<S/* MaybeMarkInert<S> */> & IonMethods<T> : never

type IonMethods<T> = Omit<T, keyof Function | 'value'>

type AnsG = NonlocalIon<ExcludePrimitives<Ion<Frog[]>>>




// type NonlocalIon<T> = { [K in keyof T as K extends 'value' ? never : K]: T[K] }
type Frog = { name: string }
class Robot {
   isRobot: true = true
}

// type Ans = StaticInput<{
//    id: number
//    name: Ion<string> & { state: string } & { changeName: () => void }
//    nameB: Ion<string> & { changeName: () => void }
//    nameC: Ion<string>
//    frogA: Ion<Ionized<Frog>>
//    frogB: Ion<Frog> // --> Ion<Inert<Frog>>
//    close: () => void
//    age?: Ion<string>
//    location?: Ion<string | undefined>
//    'mu?:email'?: Ion<string>,
//    'mu?:address': Ion<string>,
//    'mu:email'?: Ion<string>,
//    robots: Ion<Robot[]>, // $robots: Ion<Ionized<Robot[]>> | robots: Ionized<Robot[]> ---> robots={MaybeIon<Ionized<Robot[]>>}  // Robot[] OK! , but Inert<Robot>[] | Ion<Robot[]> ERROR!
//    frogC: Frog // --> Inert<Frog>
//    frogD: Ionized<Frog> // --> Ionized<Frog>
//    frogE: Inert<Frog> // --> Inert<Frog>
// }>

// type Slot = { [key: string]: RenderSlot | RawJSXNode } | RenderSlot | RawJSXNode

export type RenderSlot<T = {}> = (input?: T) => RawJSXNode



// type AnsB = ReadonlyIonInput<{
//    id: number
//    frogC: Frog // --> Inert<Frog>
//    frogD: Ionized<Frog> // --> Ionized<Frog>
//    frogE: Inert<Frog> // --> Inert<Frog>
//    'can:close': () => void
//    'on:click': {}
//    Slot: Slot
//    name: Ion<string> & { state: string } & { changeName: () => void }
//    nameB: Ion<string> & { changeName: () => void }
//    nameC: Ion<string>
//    frogA: Ion<Ionized<Frog>>
//    frogB: Ion<Frog> // --> Ion<Inert<Frog>>
//    frogO: Ion<Inert<Frog>> // --> Ion<Inert<Frog>>
//    age?: Ion<string>
//    location?: Ion<string | undefined>
//    'mu?:emailA'?: Ion<string>,
//    'mu?:addressA': Ion<string>,
//    'mu:emailB'?: Ion<string>,
//    'mu:emailReqA': Ion<string>,

//    'mu?:emailC'?: Ion<string> & { change: () => void },
//    'mu?:addressC': Ion<string> & { change: () => void },
//    'mu:emailD'?: Ion<string> & { change: () => void },
//    'mu:emailReqB': Ion<string> & { change: () => void },

//    'mu?:semailC'?: MutableIon<string> & { change: () => void },
//    'mu?:saddressC': MutableIon<string> & { change: () => void },
//    'mu:semailD'?: MutableIon<string> & { change: () => void },
//    'mu:semailReqB': MutableIon<string> & { change: () => void },
//    robots: Ion<Robot[]>, // $robots: Ion<Inert<Robot[]>> ---> robots={MaybeIon<Inert<Robot[]>>}
// }>

// type AnsC = MutableIonInput<{
//    id: number
//    frogC: Frog // --> Inert<Frog>
//    frogD: Ionized<Frog> // --> Ionized<Frog>
//    frogE: Inert<Frog> // --> Inert<Frog>
//    'can:close': () => void
//    'on:click': {}
//    Slot: Slot
//    name: Ion<string> & { state: string } & { changeName: () => void }
//    nameB: Ion<string> & { changeName: () => void }
//    nameC: Ion<string>
//    frogA: Ion<Ionized<Frog>>
//    frogB: Ion<Frog> // --> Ion<Inert<Frog>>
//    frogO: Ion<Inert<Frog>> // --> Ion<Inert<Frog>>
//    age?: Ion<string>
//    location?: Ion<string | undefined>
//    'mu?:emailA'?: Ion<string>,
//    'mu?:addressA': Ion<string>,
//    'mu:emailOptA'?: Ion<string>,
//    'mu:emailReqA': Ion<string>,

//    'mu?:emailC'?: Ion<string> & { change: () => void },
//    'mu?:addressC': Ion<string> & { change: () => void },
//    'mu:emailD'?: Ion<string> & { change: () => void },
//    'mu:emailReqB': Ion<string> & { change: () => void },

//    'mu?:semailC'?: MutableIon<string> & { change: () => void },
//    'mu?:saddressC': MutableIon<string> & { change: () => void },
//    'mu:semailD'?: MutableIon<string> & { change: () => void },
//    'mu:semailReqB': MutableIon<string> & { change: () => void },
//    robots: Ion<Robot[]>, // $robots: Ion<Inert<Robot[]>> ---> robots={MaybeIon<Inert<Robot[]>>}
// }>


// const something = null as unknown as AnsB
// something.$name.changeName()
// //@ts-expect-error
// something.$name.value = 'hi'
// something.$nameB
// something.$nameC
// something.$frogA
// something.$frogB
// something.$frogO
// something.$age
// something.$location
// something.$robots


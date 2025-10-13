import { AnyObject, ExcludePrimitives, OnlyPrimitives, Primitive, UnionToIntersection } from "@rue/types";
import { Inert, Ion, ion, ionize, Ionized, IsInert, isIon, IsIonized, isIonKey, MaybeIonize, MutableIon, neutron, toIon, toValue, } from "@rue/quarky";
import { debug, isFunction, isObject } from "@rue/utils";
import { RawJSXNode } from "../node/makeJSXNode";

//NOTE: It may be tempting to abstract the TypeDefs into a TypeDef with Generics, but because typescript
// does not have higher order generics, this is not currently possible. Must manually type them all.

export type HandleEvent<E = {}> = keyof E extends never ? (() => void) | ((event: E) => void) : (event: E) => void

export const MU_IONS = 'mu_ions'

export const MU = Symbol('mu')

// export const [getActiveMuIons, muIonsStack] = AsyncState<Set<Ion>>(MU_IONS)

export function assertMutableIon(value: unknown): asserts value is MutableIon<unknown> {
   if (!isIon(value) || !('value' in value)) throw new Error('[INVALID INPUT] attributes prefixed with mu: must receive a mutable ion')
}


export type MaybeIon<T> = T | Ion<T>


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
// - commons input
// - tag input

// TODO: Runtime check that only one of either e.g. $message or message attribute is passed in (not both)

// TODO: transform slot render function to Slot component
// Ion<string>  => Ion<string>
// Ion<string, { set: () => void }, 'mu?'>('?')
// Ionized<{}> => Ionized<{}>
// Ion <Ionized<{}>> // object will not be validated as ionized...

type HasEvent<C> = keyof C extends never ? false : Exclude<keyof C, Exclude<keyof C, `on:${string}`>> extends never ? false : true

type WithEmit<C> = C extends AnyObject ? HasEvent<C> extends true ? {
   emit: <K extends EventNames<C>>(...event: WithEventObject<K, C[`on:${K}`]>) => void
} : {} : {}

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
   if (!isFunction(value) || isIon(value)) throw new Error('Event handler must be a function')
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

export function toInput(attributes: AnyObject) {
   function emit(event: string, eventObject: object) {
      const handler = attributes['on:' + event]
      if (!handler) return;
      assertFunction(handler)
      return handler(eventObject)
   }

   const muIons = new Set()

   function isMutableIon(value: unknown) {
      return muIons.has(value); // TODO: what about fromCommons?
   }

   return new Proxy(attributes, {
      get(target, key) {
         if (typeof key !== 'string') return undefined;
         if (key === 'emit') return emit;
         if (key === '_raw_') return { ...attributes };
         if (key === 'mu') return isMutableIon;
         if (key === 'Slot') return target.children // TODO: Is this correct??
         if (isIonKey(key)) {
            const ionKeyToAttributeKey = (key: string) => key.slice(1)
            const opKey = 'can:' + key
            if (opKey in target) {
               // case: can:$frog  (as shorthand for getFrog)
               const op = target[opKey]
               assertFunction(op)
               return op;
            }
            const attributeKey = ionKeyToAttributeKey(key)
            if (attributeKey in target) {
               const value = target[attributeKey]
               return toIon(value);
            }
            const muIonKey = 'mu:' + attributeKey
            if (muIonKey in target) {
               const value = target[muIonKey]
               assertMutableIon(value)
               muIons.add(value)
               return value;
            }
            return undefined; // optional
         }
         const opKey = 'can:' + key
         if (opKey in target) {
            const op = target[opKey]
            assertFunction(op)
            return op;
         }
         // const seeKey = 'see:' + key
         // if (seeKey in target) {
         //    const op = target[seeKey]
         //    assertFunction(op)
         //    return op;
         // }
         if (key in target) {
            const value = target[key]
            if (isFunction(value) && value.length !== 0)
               debug.error('To pass a function as component input, prefix attribute with `can:`')
            return toValue(target[key])
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
   StaticInput<D>
   & MaybeIonAttributes<D>
   & MutableIonAttributes<D>
   & NonmutableIonAttributes<D>
   & TagEvents<D>
   & OpAttribute<D>
   // & SeeAttribute<D>
   & TagSlot<D>
   & (D extends { provide: infer P } ? P : {})
// [] mu ---> {mu:name: MutableIon<string>}
// [] mu? --> {mu:name: MutableIon<string>}  and {frog: MaybeIon<string>}
// [] Ion --> MaybeIon<string>
// [] Inert --> 

type TagEvents<D> = {
   [K in keyof D as K extends `on:${string}` ? K : never]: (event: D[K]) => void
}

type TagSlot<D> = D extends { Slot: infer S } ? {
   children: RawJSXNode
} : {}


type MaybeIonAttributes<D> = {
   [K in keyof D
   as IncludesIon<D[K]> extends true ?
   K extends `mu:${infer I}` ? never
   : K extends `can:${string}`/*  | `see:${string}` */ | `on:${string}` | 'Slot' ? never
   : K extends string ? K
   : never
   : never]:
   (NonlocalIon<ExcludePrimitives<D[K]>>) |
   (ExcludePrimitives<D[K]> extends Ion<infer S> ?
      S
      // MaybeMarkInert<S>
      : never)
   | (OnlyPrimitives<D[K]>)
}
type NonmutableIonAttributes<D> = {
   [K in keyof D
   as IncludesIon<D[K]> extends true ?
   K extends `mu:${infer I}` ? I
   : never
   : never]?:
   (NonlocalIon<ExcludePrimitives<D[K]>>) |
   (ExcludePrimitives<D[K]> extends Ion<infer S> ?
      S
      // MaybeMarkInert<S>
      : never)
   | (OnlyPrimitives<D[K]>)
}

type MutableIonAttributes<D> = {
   [K in keyof D
   as IncludesIon<D[K]> extends true ?
   K extends `mu:${string}` ? K
   : never
   : never]?:
   ToMuIon<ExcludePrimitives<D[K]>> | OnlyPrimitives<D[K]>
}


type ToMuIon<T> = ExcludePrimitives<T> extends { value: any } ? T
   : keyof IonMethods<T> extends never ?
   T extends Ion<infer S> ? MutableIon<S/* MaybeMarkInert<S> */> : never
   : T extends Ion<infer S> ? MutableIon<S/* MaybeMarkInert<S> */> & IonMethods<T> : never




// TODO: only allow 'mu:' for ions
export type FromTag<D> =
   StaticInput<D>
   & ReadonlyIonInput<D>
   & MutableIonInput<D>
   & WithEmit<D>
   & WithMu<D>
   & OpInput<D>
   // & SeeInput<D>
   & (D extends { Slot: infer S } ? { Slot: S } : {})
   & (D extends { provide: infer S } ? { provide: S } : { provide: undefined })
   & { '~attributes'?: TagAttributes<D> }


type WithMu<D> = HasMu<D> extends true ? {
   mu: <I extends { "~mu:": true; }>(ion: I) => ion is MuIon<I>
} : {}

type MuIon<I> = ExcludePrimitives<I> extends { value: any } ? I
   : ExcludePrimitives<I> & { value: ExcludePrimitives<I> extends Ion<infer S> ? S : never } | OnlyPrimitives<I>

type OpInput<D> = {
   [K in keyof D as K extends `can:${infer F}` ? F : never]: D[K]
}
// type SeeInput<D> = {
//    [K in keyof D as K extends `see:${infer F}` ? F : never]: D[K]
// }
type OpAttribute<D> = {
   [K in keyof D as K extends `can:${string}` ? K : never]: D[K]
}
// type SeeAttribute<D> = {
//    [K in keyof D as K extends `see:${string}` ? K : never]: D[K]
// }

type StaticInput<D> = {
   [K in keyof D as IncludesIon<D[K]> extends true ? never
   : K extends `mu:${string}` | `can:${string}`/*  | `see:${string}` */ | `on:${string}` | 'Slot' | 'provide' ? never
   : K]:
   D[K]
   // MaybeMarkInert<D[K]>
}

// export type MaybeMarkInert<T> = IsIonized<ExcludePrimitives<T>> extends true ? T : T extends Function ? T : IsInert<ExcludePrimitives<T>> extends true ? T : T extends object ? Inert<ExcludePrimitives<T>> | OnlyPrimitives<T> : T

type IncludesIon<T> = Exclude<T, Primitive> extends never ? false : Exclude<T, Primitive> extends Ion ? true : false

type ReadonlyIonInput<D> = {
   [K in keyof D
   as IncludesIon<D[K]> extends true ?
   K extends `mu:${string}` | `can:${string}` /* | `see:${string}` */ | `on:${string}` | 'Slot' ? never
   : K extends string ? `$${K}`
   : never
   : never
   ]:
   NonlocalIon<ExcludePrimitives<D[K]>> | OnlyPrimitives<D[K]>
}



type MutableIonInput<D> = {
   [K in keyof D
   as   IncludesIon<D[K]> extends true ?
   K extends `mu:${infer I}` ? `$${I}`
   : never
   : never]:
   (NonlocalIon<ExcludePrimitives<D[K]>> & { '~mu:': true } | OnlyPrimitives<D[K]>)
}

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


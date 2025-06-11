import { AnyObject, ExcludePrimitives, OnlyPrimitives, UnionToIntersection } from "@rue/types";
import { Inert, Ion, ion, ionize, Ionized, IsInert, isIon, IsIonized, isIonKey, MaybeIonize, toIon, toValue, } from "@rue/quarky";
import { getComponentAttributes } from "./makeComponent";
import { debug, isFunction, isObject } from "@rue/utils";
import { DeepReadonly, v, Readonly, MaybeIon, Input, OptionalInput, MutableInput, OptionalMutableInput, MutableIon, validateInput, manageAccess, InputTypeDef } from "./InputTypes";

// two types of component input
// - commons input
// - tag input

//TODO: Should object inputs be normalized to ionized objects?? How should they be typed?

//TODO: Runtime check that only one of either e.g. $message or message attribute is passed in (not both)


export const ATTRIBUTE_VALIDATION = Symbol('attribute-validation')


//TODO: transform slot render function to Slot component
// Ion<string>  => Ion<string>
// Ion<string, { set: () => void }, 'mu?'>('?')
// Ionized<{}> => Ionized<{}>
// Ion <Ionized<{}>> // object will not be validated as ionized...

/**
 * Component Validated Input
 */

type ComponentValidatedInput<C> = {
   [K in keyof C as
   K extends `on:${string}` ? never
   : K extends `mu:${string}` | `mu?:${string}` ? never
   : K extends `m:${infer S}` ? S
   : C[K] extends { name: 'ToIon' } ? never : K]:

   C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ?
   // K extends `mu:${string}` ? MaybeOptional<I, C[K]>
   // : K extends `mu?:${string}` ? MaybeOptional<DeepReadonly<I> | I, C[K]>
   // : 
   MaybeOptional<DeepReadonly<I>, C[K]>
   : 'invalid typeConfig'
} & (HasEvent<C> extends true ? WithEmit<C> : {}) & WithIons<C> & WithMutable<C>

type MaybeOptional<V, C> = C extends { optional: '?' } ? V | undefined : V;

type HasEvent<C> = keyof C extends never ? false : keyof C extends `on:${string}` ? true : false;

type WithEmit<C> = C extends AnyObject ? {
   emit: <K extends EventNames<C>>(eventName: K, event?: EventObj<C, `on:${K}`>) => void
} : {}

type EventObj<C extends AnyObject, K extends string> = C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ? Parameters<I extends (...args: any) => any ? I : never>[0]
   : 'invalid typeConfig'
type EventNames<C> = keyof _EventsOnly<C>

type _EventsOnly<C> = { [K in keyof C as K extends `on:${infer S}` ? S : never]: C[K] }


type WithIons<C> = {
   [K in keyof C as C[K] extends { name: 'ToIon' } ? K extends string ? `$${K}` : K : never]:

   C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ? MaybeOptional<I, C[K]>
   : 'invalid typeConfig'
}

type WithMutable<C> = {
   [K in keyof C as K extends `mu:${infer N}` | `mu?:${infer N}` ? MaybeIonKey<N, C[K]> : never]:
   C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ?
   K extends `mu:${string}` ? MaybeOptional<I, C[K]>
   : K extends `mu?:${string}` ? MaybeOptional<DeepReadonly<I> | I, C[K]>
   : never : never
}

type MaybeIonKey<K, Config> = Config extends { name: 'ToIon' } ? K extends string ? `$${K}` : K : K;

type MaybeMutableIon<I, Config> =
   Config extends { name: 'ToIon' } ?
   I : I








const exampleConfig = {
   dove: v<Dove>,
   // 'mu:frogA': v<Frog>,
   'mu?:frog': v<Frog>,
   'mu?:well': v<Well>,
   // 'mu:wellB': v<Well>
} //TODO: Mutable Ions with state and set

type Frog = { name: string }
type Well = { depth: number }
type Dove = { distance: number }

type ExampleRequired = {
   'mu:frog': Frog
} | {
   frog: Frog
}

type ExampleOptional = {
   'mu:frog'?: Frog
} | {
   frog?: Frog
}

type Res = ComponentAttributes<typeof exampleConfig>

function tryIt(input: Res) {

}

const f = null as unknown as Frog
const w = null as unknown as Well
const d = null as unknown as Dove

tryIt({ "mu:frog": f, dove: d, "mu:well": w })
tryIt({ frog: f, dove: d, "mu:well": w })
tryIt({ "mu:frog": f, dove: d, well: w })
tryIt({ frog: f, dove: d, well: w })

//@ts-expect-error
tryIt({ "mu:frog": f, dove: d })

//@ts-expect-error
tryIt({ dove: d, "mu:well": w })

//@ts-expect-error
tryIt({ frog: f, dove: d })

//@ts-expect-error
tryIt({ dove: d, well: w })


/**
 * Component Tag Attributes
 */

// type ComponentAttributes<C> = {
//    [K in keyof C as C[K] extends { required: true } & ((arg: any) => { inputType: any }) ? K extends `mu?:${string}` ? never : K : never]:
//    C[K] extends ((arg: any) => { inputType: infer I }) ? I : 'invalid typeConfig'
// } & {
//    [K in keyof C as C[K] extends { optional: '?' | 'withDefault', inputType: any } ? K extends `mu?:${string}` ? never : K : never]?:
//    C[K] extends { inputType: infer I } ? I : 'invalid typeConfig'
// } & (WithMaybeMutables<C> extends never ? {} : WithMaybeMutables<C>)
// & {
//    [K in keyof C as K extends `mu?:${infer S}` ? `mu:${K}` : never]:
//    C[K] extends (arg: any) => { $inputType: infer I } ? I : 'invalid typeConfig'
// } & {
//    [K in keyof C as C[K] extends { name: '$Ionized' | '$Ion'; optional: '?' | 'withDefault' } ? K extends string ? `$${K}` : never : never]?:
//    C[K] extends { $inputType: infer I } ? I : 'invalid typeConfig'
// }

type WithMaybeMutables<C> = IntersectionOfUnions<UnionToIntersection<(keyof RequiredMaybeMutables<C> extends never ? {} : RequiredMaybeMutables<C>[keyof RequiredMaybeMutables<C>])
   & (keyof OptionalMaybeMutables<C> extends never ? {} : OptionalMaybeMutables<C>[keyof OptionalMaybeMutables<C>])>>

type Eh = WithMaybeMutables<typeof exampleConfig>

type IntersectionOfUnions<T> =
   // Convert each intersected tuple to a union using distributive conditional types
   (T extends any[] ? TupleToUnion<T> : never);

type TupleToUnion<T extends any[]> = T[number];


type RequiredMaybeMutables<C> = {
   [K in keyof C as C[K] extends { required: true } & ((arg: any) => { inputType: any }) ? K extends `mu?:${infer S}` ? S : never : never]:
   C[K] extends ((arg: any) => { inputType: infer I }) ? K extends `mu?:${infer S}` ? [{ [K in `mu:${S}`]: I }, { [K in S]: I }] : never : 'invalid typeConfig'
}

type OptionalMaybeMutables<C> = {
   [K in keyof C as C[K] extends { optional: '?' | 'withDefault', inputType: any } ? K extends `mu?:${infer S}` ? S : never : never]:
   C[K] extends { inputType: infer I } ? K extends `mu?:${infer S}` ? [{ [K in `mu:${S}`]?: I }, { [K in S]?: I }] : never : 'invalid typeConfig'
}

export type RequiredInputKey<K extends string, C> = C extends { required: true } & ((arg: any) => { inputType: any }) ? ExcludeMutableKey<K> : never
export type OptionalInputKey<K extends string, C> = C extends { optional: '?' | 'withDefault', inputType: any } ? ExcludeMutableKey<K> : never
export type RequiredMutableInputKey<K extends string, C> = C extends { required: true } & ((arg: any) => { inputType: any }) ? InferMutableOnlyKey<K> : never;
export type OptionalMutableInputKey<K extends string, C> = C extends { optional: '?' | 'withDefault', inputType: any } ? InferMutableOnlyKey<K> : never;

export type ExcludeMutableKey<K extends string> = K extends `mu?:${string}` ? never : K extends `mu:${string}` ? never : K extends `Slot` ? `children` : K
type InferMutableOnlyKey<K extends string> = K extends `mu:${infer S}` ? S : never

type ComponentAttributes<C> =
   { [K in keyof C as  K extends string ? RequiredInputKey<K, C[K]> : never]: K extends string ? Input<C[K]> : never }
   & { [K in keyof C as K extends string ? OptionalInputKey<K, C[K]> : never]?: K extends string ? OptionalInput<C[K]> : never }

   & { [K in keyof C as K extends string ? RequiredMutableInputKey<K, C[K]> : never]: K extends string ? MutableInput<K, C[K]> : never }
   & { [K in keyof C as K extends string ? OptionalMutableInputKey<K, C[K]> : never]?: K extends string ? OptionalMutableInput<K, C[K]> : never }
   & (WithMaybeMutables<C> extends never ? {} : WithMaybeMutables<C>)



//API
export function fromTag<C>(): TagInput<C> {
   // C extends {} ? { [K in keyof ComponentValidatedInput<C>]: ComponentValidatedInput<C>[K] } & { [ATTRIBUTES]: C extends undefined ? AnyObject : ComponentAttributes<C> } : AnyObject {
   const attributes = getComponentAttributes()
   if (!attributes) throw new Error(`input function must be called as default parameter of component factory`)
   return toInput(attributes) as TagInput<C>
   // return prep(attributes, typeConfig) as C extends {} ? ComponentValidatedInput<C> & { [ATTRIBUTES]: C extends undefined ? AnyObject : ComponentAttributes<C> } : AnyObject
}

function assertFunction(value: unknown) {
   if (!isFunction(value) || isIon(value)) throw new Error('Event handler must be a function')
}

//TODO: Slots

function toInput(attributes: AnyObject) {

   function emit(event: string, eventObject: object) {
      const handler = attributes['on:' + event]
      if (!handler) return;
      assertFunction(handler)
      return handler(eventObject)
   }

   let muIons: Set<Ion> | undefined;

   function mu(ion: Ion) {
      return muIons ? muIons.has(ion) : (muIons = getMuIons(attributes), muIons.has(ion))
   }

   function getMuIons(attributes: AnyObject) {
      const muIons: Set<Ion> = new Set()
      for (const key in attributes) {
         if (key.startsWith('mu')) {
            const value = attributes[key]
            assertMutableIon(value)
            muIons.add(value)
         }
      }
      return muIons
   }

   function assertMutableIon(value: unknown) {
      if (!isIon(value) || !('state' in value)) throw new Error('[INVALID INPUT] attributes prefixed with mu: must receive a mutable ion')
   }

   return new Proxy(attributes, {
      get(target, key) {
         if (typeof key !== 'string') return undefined;
         if (key === 'emit') return emit;
         if (key === 'mu') return mu;
         if (key === 'slots') return target.children // TODO: Is this correct??
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
               const value = target[ionKeyToAttributeKey(key)]
               return ion(value);
            }
            return undefined; // optional
         }
         const opKey = 'can:' + key
         if (opKey in target) {
            const op = target[opKey]
            assertFunction(op)
            return op;
         }
         if (key in target) {
            const value = target[key]
            if (isFunction(value) && !isIon(value))
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
         return key in target; //TODO:
      }
   })
}


//TODO: only allow 'mu:' for ions
type TagInput<D> =
   StaticInput<D>
   & ReadonlyIonInput<D>
   & MutableIonInput<D>
   & WithEmit<D>
   & WithMu
   & OpInput<D>
   & SlotsInput<D>

type WithMu = {
   mu: <I extends { "~mu:": true; }>(ion: I) => ion is MuIon<I>
}


type StaticInput<D> = {
   [K in keyof D as
   IncludesIon<D[K]> extends true ? never
   : K extends `mu:${string}` ? never
   : K extends `mu?:${string}` ? never
   : K extends `can:${string}` ? never
   : K extends `on:${string}` ? never
   : K extends `slots` ? never
   : K]:
   MaybeMarkInert<D[K]>
}

export type MaybeMarkInert<T> = IsIonized<T> extends true ? T : T extends Function ? T : IsInert<T> extends true ? T : T extends object ? Inert<T> : T

type IncludesIon<T> = Exclude<T, undefined> extends Ion ? true : false

// type MappedC<A, B> = {
//    [K in keyof A & keyof B]:
//    A[K] extends B[K]
//    ? never
//    : K
// };

// type IsOptional<T, K extends keyof T> =
//    {} extends Pick<T, K> ? true : false;

// type Mapped<T> = {
//    [K in keyof T]-?: IsOptional<T, K> extends true
//    ? undefined extends T[K]
//    ? { [P in K]: T[K] }[K]        // optional + explicitly undefined → keep it
//    : NonNullable<T[K]>           // optional + no explicit undefined → strip it
//    : T[K];                          // not optional → leave as is
// };



type ReadonlyIonInput<D> = {
   [K in keyof D
   as IncludesIon<D[K]> extends true ?
   K extends `mu:${string}` ? never
   : K extends `mu?:${string}` ? never
   : K extends `can:${string}` ? never
   : K extends `on:${string}` ? never
   : K extends `slots` ? never
   : K extends string ? `$${K}`
   : never
   : never
   ]:
   NonlocalIon<ExcludePrimitives<D[K]>> | OnlyPrimitives<D[K]>
}



type MutableIonInput<D> = {
   [K in keyof D
   as IncludesIon<D[K]> extends true ?
   K extends `mu:${infer I}` ? `$${I}`
   : K extends `mu?:${infer I}` ? `$${I}`
   : K extends `can:${string}` ? never
   : K extends `on:${string}` ? never
   : K extends `slots` ? never
   : never
   : never
   ]:
   (NonlocalIon<ExcludePrimitives<D[K]>> & { '~mu:': true } | OnlyPrimitives<D[K]>)
}

// type AsMuIon<I> = ExcludePrimitives<I> extends { '~mu:': true } ? MuIon<I>
//    : ExcludePrimitives<I> extends { '~mu:': boolean } ? MuIon<I> | undefined
//    : undefined

type MuIon<I> = ExcludePrimitives<I> extends { state: any } ? I
   : ExcludePrimitives<I> & { state: ExcludePrimitives<I> extends Ion<infer S> ? S : never } | OnlyPrimitives<I>




type NonlocalIon<T> = keyof IonMethods<T> extends never ? T extends Ion<infer S> ? Ion<MaybeMarkInert<S>> : never : T extends Ion<infer S> ? Ion<MaybeMarkInert<S>> & { [K in keyof T as K extends 'state' ? never : K]: T[K] } : never

type IonMethods<T> = Omit<T, keyof Function>

/**
 * Types all properties as readonly and hides any function that is not marked pure.
 * Deep read-only--Makes any nested objects read-only as well.
 **/
export type DeepNonlocal<T> = T extends Function ? T : T extends (infer E)[] ? readonly DeepNonlocal<E>[] : T extends Object ? Nonlocal<T> : T;


export type Nonlocal<T> = {
   readonly [K in keyof T]: DeepNonlocal<T[K]>
}

// type NonlocalIon<T> = { [K in keyof T as K extends 'state' ? never : K]: T[K] }

class Robot {
   isRobot: true = true
}

type Ans = StaticInput<{
   id: number
   name: Ion<string> & { state: string } & { changeName: () => void }
   nameB: Ion<string> & { changeName: () => void }
   nameC: Ion<string>
   frogA: Ion<Ionized<Frog>>
   frogB: Ion<Frog> // --> Ion<Inert<Frog>>
   close: () => void
   age?: Ion<string>
   location?: Ion<string | undefined>
   'mu?:email'?: Ion<string>,
   'mu?:address': Ion<string>,
   'mu:email'?: Ion<string>,
   robots: Ion<Robot[]>, // $robots: Ion<Ionized<Robot[]>> | robots: Ionized<Robot[]> ---> robots={MaybeIon<Ionized<Robot[]>>}  // Robot[] OK! , but Inert<Robot>[] | Ion<Robot[]> ERROR!
   frogC: Frog // --> Inert<Frog>
   frogD: Ionized<Frog> // --> Ionized<Frog>
   frogE: Inert<Frog> // --> Inert<Frog>
}>

type Slots = { [key: string]: (input: AnyObject) => any[] } | ((input: AnyObject) => any[])

type Slot<T> = (input: T) => any[]

type MutableIon<T> = Ion<T> & { state: T }

type AnsB = ReadonlyIonInput<{
   id: number
   frogC: Frog // --> Inert<Frog>
   frogD: Ionized<Frog> // --> Ionized<Frog>
   frogE: Inert<Frog> // --> Inert<Frog>
   'can:close': () => void
   'on:click': {}
   slots: Slots
   name: Ion<string> & { state: string } & { changeName: () => void }
   nameB: Ion<string> & { changeName: () => void }
   nameC: Ion<string>
   frogA: Ion<Ionized<Frog>>
   frogB: Ion<Frog> // --> Ion<Inert<Frog>>
   frogO: Ion<Inert<Frog>> // --> Ion<Inert<Frog>>
   age?: Ion<string>
   location?: Ion<string | undefined>
   'mu?:emailA'?: Ion<string>,
   'mu?:addressA': Ion<string>,
   'mu:emailB'?: Ion<string>,
   'mu:emailReqA': Ion<string>,

   'mu?:emailC'?: Ion<string> & { change: () => void },
   'mu?:addressC': Ion<string> & { change: () => void },
   'mu:emailD'?: Ion<string> & { change: () => void },
   'mu:emailReqB': Ion<string> & { change: () => void },

   'mu?:semailC'?: MutableIon<string> & { change: () => void },
   'mu?:saddressC': MutableIon<string> & { change: () => void },
   'mu:semailD'?: MutableIon<string> & { change: () => void },
   'mu:semailReqB': MutableIon<string> & { change: () => void },
   robots: Ion<Robot[]>, // $robots: Ion<Inert<Robot[]>> ---> robots={MaybeIon<Inert<Robot[]>>}
}>

type AnsC = MutableIonInput<{
   id: number
   frogC: Frog // --> Inert<Frog>
   frogD: Ionized<Frog> // --> Ionized<Frog>
   frogE: Inert<Frog> // --> Inert<Frog>
   'can:close': () => void
   'on:click': {}
   slots: Slots
   name: Ion<string> & { state: string } & { changeName: () => void }
   nameB: Ion<string> & { changeName: () => void }
   nameC: Ion<string>
   frogA: Ion<Ionized<Frog>>
   frogB: Ion<Frog> // --> Ion<Inert<Frog>>
   frogO: Ion<Inert<Frog>> // --> Ion<Inert<Frog>>
   age?: Ion<string>
   location?: Ion<string | undefined>
   'mu?:emailA'?: Ion<string>,
   'mu?:addressA': Ion<string>,
   'mu:emailOptA'?: Ion<string>,
   'mu:emailReqA': Ion<string>,

   'mu?:emailC'?: Ion<string> & { change: () => void },
   'mu?:addressC': Ion<string> & { change: () => void },
   'mu:emailD'?: Ion<string> & { change: () => void },
   'mu:emailReqB': Ion<string> & { change: () => void },

   'mu?:semailC'?: MutableIon<string> & { change: () => void },
   'mu?:saddressC': MutableIon<string> & { change: () => void },
   'mu:semailD'?: MutableIon<string> & { change: () => void },
   'mu:semailReqB': MutableIon<string> & { change: () => void },
   robots: Ion<Robot[]>, // $robots: Ion<Inert<Robot[]>> ---> robots={MaybeIon<Inert<Robot[]>>}
}>


const something = null as unknown as AnsB
something.$name.changeName()
something.$name.state = 'hi'
something.$nameB
something.$nameC
something.$frogA
something.$frogB
something.$frogO
something.$age
something.$location
something.$robots

const mut = null as unknown as AnsC & WithMu
const { $emailReqA, $emailReqB, $semailReqB, $emailD, $emailOptA, $semailD, $addressA, $addressC, $saddressC, $emailA, $emailC, $semailC, mu } = mut

//@ts-expect-error
if (mu(something.$nameB)) { }

if (mu($emailReqA)) $emailReqA.state = 'kjl'

if (mu($addressA)) $addressA.state = 'kjl'



//NOTE: `'state' in $email` cannot be used to check if ion is mutable, because it will evaluate to true even when parent doesn't want it to
// if ($emailA && 'state' in $emailA) $emailA.state = 'df'

// export function RoboCard(input = fromTag<{
//    id: Static<number>, ---> id: number
//    name: string, 
//    'mu?:email'?: string, ---> $email | email
//    'mu:email'?: string, ---> $email
//    robots: Robot[], // $robots: Ion<Ionized<Robot[]>> | robots: Ionized<Robot[]> ---> robots={MaybeIon<Ionized<Robot[]>>}  // Robot[] OK! , but Inert<Robot>[] | Ion<Robot[]> ERROR!
//    frog: Inert<Frog> // ion(frog) | frog --> $frog: Ion<Frog> | frog: Inert<Frog> ---> frog={MaybeIon<Frog>}
// }>()) {
//    const {
//       id, 
//       $name,
//       $email = new Email(), 
//       $robots, 
//       $frog, 
//    } = input

//    if (mu($email)) mu($email).state = new Email()

//    const $frog = fromCommons.ion('mu?')(FROG)
//    const list = fromCommons(LIST)

// assertions?: { [K in keyof C]?: ((value: any) => void) | ((value: any) => void)[] }

export function unnestValue(value: any) {
   if (isIon(value)) {
      if (__DEV__) console.warn('RESEARCH: Had to unnest value from ion... you may be writing inefficient code')
      return unnestValue(value());
   }
   return value;
}

function prep<C extends AnyObject | undefined>(attributes: AnyObject, typeConfig: C) {
   let eventHandlers: AnyObject | undefined;
   if (typeConfig) {
      const validatedAttributes = {} as AnyObject;

      //TODO: I need to check typeConfig for default values
      for (const key in attributes) {
         let value = (<AnyObject>attributes)[key]
         // if (assertions && assertions[key]) {
         //    const validation = assertions[key]
         //    const _assertions = validation instanceof Array ? validation : [validation]
         //    for (const assert of _assertions) {
         //       assert(isIon(value) ? value() : value);
         //    }
         // }
         if (typeConfig) {
            const config = typeConfig[key];
            if (config === undefined) continue;
            const keyTuple = key.split(':')
            const isNamespaced = keyTuple.length === 2;
            const _key = isNamespaced ? keyTuple[1] : keyTuple[0]
            const access = keyTuple[1]
            value = manageAccess(validateInput(value, config, key), access)

            switch (config.name) {
               case 'v':
                  if (key.startsWith('on:')) {
                     if (!isFunction(value) || isIon(value)) throw new Error('event handler must be a function')
                     const handlers = eventHandlers || (validatedAttributes.emit = (event: string) => { eventHandlers![event]() }, eventHandlers = {})
                     handlers['emit' + _key] = value;
                  }
                  else validatedAttributes[_key] = value;
                  break;

               case 'ToIon':
                  validatedAttributes['$' + _key] = value
                  break;

               case 'ToIonized':
                  validatedAttributes[_key] = value;
                  break;

               default:
                  validatedAttributes[_key] = value;
                  break;
            }
         }
      }
      return validatedAttributes as ComponentValidatedInput<C>
   }
   return attributes
   // as ComponentValidatedInput<C>
}


// example:
// const input = fromTag({
//     'on:IncrementClick': v<() => void>,
//     car: v<number>('??')(20),
//     frog: v<boolean>,
//     dog: v<number>('?'),
//     sun: Ion<number | string>,
//     stars: MaybeIon<number>('?'),
//     moon: $Ion<number | string, { setMoon(): void }>('?'),
// })

// const { emitIncrementClick, dog, car, frog, $sun, $moon, $stars } = prep(input)
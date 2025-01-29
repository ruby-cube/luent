import { AnyObject, UnionToIntersection } from "@rue/types";
import { AnyIon, Ion, isIon, isIonizedModel, isReined, readonly } from "@rue/quarky";
import { toIon, toValue } from "../../../quarky/src/ion/toIons";
import { getComponentAttributes } from "./makeComponent";
import { isFunction, isObject } from "@rue/utils";
import { DeepReadonly, v } from "../InputTypes";

//TODO: Runtime check that only one of either e.g. $message or message attribute is passed in (not both)


export const ATTRIBUTE_VALIDATION = Symbol('attribute-validation')

// const attributes = $input(attrs)
// const input = prep(attributes)

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
   : K extends `nu:${infer S}` | `nu?:${infer S}` | `m:${infer S}` ? S
   : C[K] extends { name: 'MaybeIon' } ? never : K]:

   C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ?
   K extends `nu:${string}` ? MaybeOptional<I, C[K]>
   : K extends `nu?:${string}` ? MaybeOptional<DeepReadonly<I>, C[K]>
   : MaybeOptional<DeepReadonly<I>, C[K]>
   : 'invalid typeConfig'
} & WithEmit<C> & WithIons<C>

type MaybeOptional<V, C> = C extends {optional: '?'} ? V | undefined : V;


type WithEmit<C> = C extends { [key: `on:${string}`]: any } ? { 
   emit: <K extends EventNames<C>>(eventName: K, event: EventObj<C, `on:${K}`>) => void 
} : {}

type EventObj<C extends AnyObject, K extends string> = C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ? Parameters<I extends (...args: any) => any ? I : never>[0]
   : 'invalid typeConfig'
type EventNames<C> = keyof _EventsOnly<C>

type _EventsOnly<C> = { [K in keyof C as K extends `on:${infer S}` ? S : never]: C[K] }


type WithIons<C> = {
   [K in keyof C as C[K] extends { name: 'MaybeIon' } ? K extends string ? `$${K}` : K : never]:

   C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ? MaybeOptional<I, C[K]>
   : 'invalid typeConfig'
}


const exampleConfig = {
   dove: v<Dove>,
   'nu?:frog': v<Frog>,
   'nu?:well': v<Well>
}

type Frog = { name: string }
type Well = { depth: number }
type Dove = { distance: number }

type ExampleRequired = {
   'nu:frog': Frog
} | {
   frog: Frog
}

type ExampleOptional = {
   'nu:frog'?: Frog
} | {
   frog?: Frog
}

type Res = ComponentAttributes<typeof exampleConfig>

function tryIt(input: Res) {

}

const f = null as unknown as Frog
const w = null as unknown as Well
const d = null as unknown as Dove

tryIt({ "nu:frog": f, dove: d, "nu:well": w })
tryIt({ frog: f, dove: d, "nu:well": w })
tryIt({ "nu:frog": f, dove: d, well: w })
tryIt({ frog: f, dove: d, well: w })

//@ts-expect-error
tryIt({ "nu:frog": f, dove: d })

//@ts-expect-error
tryIt({ dove: d, "nu:well": w })

//@ts-expect-error
tryIt({ frog: f, dove: d })

//@ts-expect-error
tryIt({ dove: d, well: w })

/**
 * Component Tag Attributes
 */

type ComponentAttributes<C> = {
   [K in keyof C as C[K] extends { required: true } & ((arg: any) => { inputType: any }) ? K extends `nu?:${string}` ? never : K : never]:
   C[K] extends ((arg: any) => { inputType: infer I }) ? I : 'invalid typeConfig'
} & {
   [K in keyof C as C[K] extends { optional: '?' | 'withDefault', inputType: any } ? K extends `nu?:${string}` ? never : K : never]?:
   C[K] extends { inputType: infer I } ? I : 'invalid typeConfig'
} & (WithMaybeMutables<C> extends never ? {} : WithMaybeMutables<C>)
// & {
//    [K in keyof C as K extends `nu?:${infer S}` ? `nu:${K}` : never]:
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
   [K in keyof C as C[K] extends { required: true } & ((arg: any) => { inputType: any }) ? K extends `nu?:${infer S}` ? S : never : never]:
   C[K] extends ((arg: any) => { inputType: infer I }) ? K extends `nu?:${infer S}` ? [{ [K in `nu:${S}`]: I }, { [K in S]: I }] : never : 'invalid typeConfig'
}

type OptionalMaybeMutables<C> = {
   [K in keyof C as C[K] extends { optional: '?' | 'withDefault', inputType: any } ? K extends `nu?:${infer S}` ? S : never : never]:
   C[K] extends { inputType: infer I } ? K extends `nu?:${infer S}` ? [{ [K in `nu:${S}`]?: I }, { [K in S]?: I }] : never : 'invalid typeConfig'
}



//API
export function fromTag<C>(typeConfig?: C & { [key: string]: { validatedType: any } | ((arg: any) => { validatedType: any }) }): C extends {} ? { [K in keyof ComponentValidatedInput<C>]: ComponentValidatedInput<C>[K] } & { [ATTRIBUTES]: C extends undefined ? AnyObject : ComponentAttributes<C> } : AnyObject {
   const attributes = getComponentAttributes()
   if (!attributes) throw new Error(`input function must be called as default parameter of component factory`)
   return prep(attributes, typeConfig) as C extends {} ? ComponentValidatedInput<C> & { [ATTRIBUTES]: C extends undefined ? AnyObject : ComponentAttributes<C> } : AnyObject
}

export function isNamedDerivation(value: any) {
   return value instanceof Function && isIon(value)
}

// assertions?: { [K in keyof C]?: ((value: any) => void) | ((value: any) => void)[] }

export function unnestValue(value: any) {
   if (isIon(value)) {
      if (__DEV__) console.warn('RESEARCH: Had to unnest value from ion... you may be writing inefficient code')
      return unnestValue(value());
   }
   return value;

}

//API
export function prep<C extends AnyObject | undefined>(attributes: AnyObject, typeConfig: C) {
   let eventHandlers: AnyObject | undefined;
   if (typeConfig) {
      const validatedAttributes = {} as AnyObject;

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
            console.log('typeConfig', typeConfig, key)
            const config = typeConfig[key];
            if (config === undefined) continue;
            if ('optional' in config && value === undefined && 'default' in config && isFunction(config.default)) {
               value = config.default()
            }
            else if (!('optional' in config) && value === undefined) {
               throw new Error(`[INVALID INPUT] Required component attribute, ${key}, is undefined`)
            }

            switch (config.name) {
               case 'v':
                  const vKey = key.startsWith('nu:') || key.startsWith('on:') ? key.slice(3) : key;
                  if (key.startsWith('on:')) {
                     if (!isFunction(value) || isIon(value)) throw new Error('event handler must be a function')
                     const handlers = eventHandlers || (validatedAttributes.emit = (event: string) => { eventHandlers![event]() }, eventHandlers = {})
                     handlers['emit' + vKey] = value;
                  }
                  // else validatedAttributes[key] = (isFunction(value) || isReined(value)) ? value : value instanceof Object ? readonly(value) : value;
                  else validatedAttributes[vKey] = unnestValue(value);
                  break;

               case 'MaybeIon':
                  const ionKey = key.startsWith('nu:') ? key.slice(3) : key;
                  // if (!isIon(value)) {
                  //    throw new Error(`[INVALID INPUT] Value of '${key}' attribute must be an ion`)
                  // }
                  // validatedAttributes['$' + key] = value;
                  // validatedAttributes['$' + key] = isReined(value) ? value : readonly(value);
                  validatedAttributes['$' + ionKey] = toIon(value) //QUESTION: We don't unnest value here... there may be deeply nested ions
                  break;

               // case 'MaybeIon':
               //    // validatedAttributes['$' + key] = isNamedDerivation(value) ? value : isIon(value) ? isReined(value) ? value : readonly(value) : readonly(toIon(value))
               //    break;

               case 'MaybeIonized':
                  const modelKey = key.startsWith('nu:') ? key.slice(3) : key;
                  // const model = unnestValue(value)
                  // if (!isIonizedModel(model)) {
                  //    throw new Error(`[INVALID INPUT] Value of '${key}' attribute must be an ionized`)
                  // }
                  // // validatedAttributes[key] = isReined(value) ? value : readonly(value);
                  // validatedAttributes[key] = model
                  const _value = unnestValue(value)
                  if (!isObject(_value)) throw new Error(`[INVALID INPUT] Value of '${key}' attribute must be an object`)
                  validatedAttributes[modelKey] = _value;
                  break;

               // case 'MaybeIonized':
               //    // const _value = unnestValue(value)
               //    // validatedAttributes[key] = isReined(value) ? _value : readonly(_value);
               //    break;

               default:
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
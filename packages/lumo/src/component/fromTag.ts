import { AnyObject } from "@rue/types";
import { MetaIonizedModel } from "../../../quarky/src/ionize/MetaIonizedModel";
import { AtomicIon, DerivedIon, isIon, isIonizedModel, rein, WritableDerivedIon } from "@rue/quarky";
import { META } from "../../../quarky/src/ReactiveEntity";
import { toIon } from "../../../quarky/src/ion/toIons";
import { getComponentAttributes } from "./makeComponent";
import { $Ion, Ion, MaybeIon, v } from "../InputTypes";

//TODO: Runtime check that only one of either e.g. $message or message attribute is passed in (not both)


export const ATTRIBUTE_VALIDATION = Symbol('attribute-validation')

// const attributes = $input(attrs)
// const input = prep(attributes)

//TODO: transform slot render function to Slot component

type ComponentValidatedInput<C> = {
   [K in keyof C as C[K] extends { required: true } | { default: true } ? K extends `on:${infer S}` ? `emit${S}` : C[K] extends {
      name: '_Ref' | '_Ion' | '_Ionized' | 'MaybeIonized' | 'MaybeIon' | '$IonOrIon' | '$IonizedOrIonized' | '$Ion' | '$Ref' | '$Ionized'
   } ? K extends string ? `$${K}` : K : K : never]:

   C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ? I
   : 'invalid typeConfig'
} & {
   [K in keyof C as C[K] extends { optional: '?' } ? K extends `on:${infer S}` ? `emit${S}` : C[K] extends {
      name: '_Ref' | '_Ion' | '_Ionized' | 'MaybeIonized' | 'MaybeIon' | '$IonOrIon' | '$IonizedOrIonized' | '$Ion' | '$Ref' | '$Ionized'
   } ? K extends string ? `$${K}` : K : K : never]?:

   C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ? I
   : 'invalid typeConfig'
}


type ComponentAttributes<C> = {
   [K in keyof C as C[K] extends { required: true } & ((arg: any) => { inputType: any }) ? K : never]:
   C[K] extends ((arg: any) => { inputType: infer I }) ? I : 'invalid typeConfig'
} & {
   [K in keyof C as C[K] extends { optional: '?' | 'withDefault', inputType: any } ? K : never]?:
   C[K] extends { inputType: infer I } ? I : 'invalid typeConfig'
} & {
   [K in keyof C as C[K] extends { name: '$IonOrIon' | '$IonizedOrIonized' | '$Ionized' | '$Ion' | '$Ref'; required: true } & ((arg: any) => { $inputType: any }) ? K extends string ? `$${K}` : never : never]:
   C[K] extends (arg: any) => { $inputType: infer I } ? I : 'invalid typeConfig'
} & {
   [K in keyof C as C[K] extends { name: '$IonOrIon' | '$IonizedOrIonized' | '$Ionized' | '$Ion' | '$Ref'; optional: '?' | 'withDefault' } ? K extends string ? `$${K}` : never : never]?:
   C[K] extends { $inputType: infer I } ? I : 'invalid typeConfig'
} 
// & {
//    [ATTRIBUTE_VALIDATION]?: C
// }


//API
export function fromTag<C>(typeConfig?: C & { [key: string]: { validatedType: any } | ((arg: any) => { validatedType: any }) }): C extends {} ? { [K in keyof ComponentValidatedInput<C>]: ComponentValidatedInput<C>[K] } & { [ATTRIBUTES]: C extends undefined ? AnyObject : { [K in keyof ComponentAttributes<C>]: ComponentAttributes<C>[K] }}:AnyObject  {
   const attributes = getComponentAttributes()
   if (!attributes) throw new Error(`input function must be called as default parameter of component factory`)
   return prep(attributes, typeConfig) as C extends {} ?  ComponentValidatedInput<C> & { [ATTRIBUTES]: C extends undefined ? AnyObject : ComponentAttributes<C> }: AnyObject
}

export function isDerivation(value: any) {
   return value instanceof Function && value.name.startsWith('$')
}

function isStateGetter(value: any): value is () => any {
   return isDerivation(value) || isIon(value)
}

// assertions?: { [K in keyof C]?: ((value: any) => void) | ((value: any) => void)[] }

//API
export function prep<C extends AnyObject | undefined>(attributes: AnyObject, typeConfig: C) {
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
            if ('optional' in config && value === undefined && 'default' in config && config.default instanceof Function) {
               value = config.default()
            }
            else if (!('optional' in config) && value === undefined) {
               throw new Error(`[INVALID INPUT] Required component attribute, ${key}, is undefined`)
            }

            switch (config.name) {
               case 'v':
                  if (key.startsWith('m:')) {
                     validatedAttributes[key.slice(2)] = value;
                  }
                  else if (isStateGetter(value)) { //TODO: I don't know if the conditional structure is correct
                     value = value()
                  }
                  else if (key.startsWith('on:') && value instanceof Function) {
                     validatedAttributes['emit' + key.slice(3)] = value;
                  }
                  else validatedAttributes[key] = value; //TODO: make readonly
                  break;

               case '_Ion':
               case '_Ref':
                  if (!isStateGetter(value)) {
                     throw new Error(`[INVALID INPUT] Value of '${key}' attribute must be an ion`)
                  }
                  const ionkey = key.startsWith('m:') ? key.slice(2) : key
                  validatedAttributes['$' + ionkey] = value; //TODO: make Ion read-only, rein $Ion
                  break;

               case 'MaybeIon':
                  validatedAttributes['$' + key] = isDerivation(value) ? value : toIon(value) //TODO: make Ion read-only
                  break;

               case '_Ionized':
                  if (!isIonizedModel(value)) {
                     throw new Error(`[INVALID INPUT] Value of '${key}' attribute must be an ionized`)
                  }
                  const ionizedKey = key.startsWith('m:') ? key.slice(2) : key
                  validatedAttributes['$' + ionizedKey] = value; //TODO: readonly, rein
                  break;

               case 'MaybeIonized':
                  const maybeIonizedKey = key.startsWith('m:') ? key.slice(2) : key
                  validatedAttributes['$' + maybeIonizedKey] = value; //TODO: readonly
                  break;

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
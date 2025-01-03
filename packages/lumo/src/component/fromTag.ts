import { AnyObject } from "@rue/types";
import { isIon, isIonizedModel, isReined, readonly } from "@rue/quarky";
import { toIon } from "../../../quarky/src/ion/toIons";
import { getComponentAttributes } from "./makeComponent";
import { isFunction } from "@rue/utils";

//TODO: Runtime check that only one of either e.g. $message or message attribute is passed in (not both)


export const ATTRIBUTE_VALIDATION = Symbol('attribute-validation')

// const attributes = $input(attrs)
// const input = prep(attributes)

//TODO: transform slot render function to Slot component
// Ion<string>  => Ion<string>
// Ion<string, { set: () => void }, 'mu?'>('?')
// Ionized<{}> => Ionized<{}>
// Ion <Ionized<{}>> // object will not be validated as ionized...

type ComponentValidatedInput<C> = {
   [K in keyof C as C[K] extends { required: true } | { default: true } ? K extends `on:${infer S}` ? `emit${S}` : C[K] extends {
      name: '_Ion' | '_Ionized' | 'MaybeIonized' | 'MaybeIon'
   } ? K extends string ? `$${K}` : K : K : never]:

   C[K] extends { validatedType: infer I } | ((arg: any) => { validatedType: infer I }) ? I
   : 'invalid typeConfig'
} & {
   [K in keyof C as C[K] extends { optional: '?' } ? K extends `on:${infer S}` ? `emit${S}` : C[K] extends {
      name: '_Ion' | '_Ionized' | 'MaybeIonized' | 'MaybeIon'
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
export function fromTag<C>(typeConfig?: C & { [key: string]: { validatedType: any } | ((arg: any) => { validatedType: any }) }): C extends {} ? { [K in keyof ComponentValidatedInput<C>]: ComponentValidatedInput<C>[K] } & { [ATTRIBUTES]: C extends undefined ? AnyObject : { [K in keyof ComponentAttributes<C>]: ComponentAttributes<C>[K] } } : AnyObject {
   const attributes = getComponentAttributes()
   if (!attributes) throw new Error(`input function must be called as default parameter of component factory`)
   return prep(attributes, typeConfig) as C extends {} ? ComponentValidatedInput<C> & { [ATTRIBUTES]: C extends undefined ? AnyObject : ComponentAttributes<C> } : AnyObject
}

export function isNamedDerivation(value: any) {
   return value instanceof Function && isIon(value)
}

// function isStateGetter(value: any): value is () => any {
//    return isNamedDerivation(value) || isIon(value)
// }

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
            if ('optional' in config && value === undefined && 'default' in config && isFunction(config.default)) {
               value = config.default()
            }
            else if (!('optional' in config) && value === undefined) {
               throw new Error(`[INVALID INPUT] Required component attribute, ${key}, is undefined`)
            }

            switch (config.name) {
               case 'v':
                  if (isIon(value)) { //TODO: I don't know if the conditional structure is correct
                     value = value()
                  }
                  else if (key.startsWith('on:') && isFunction(value)) {
                     validatedAttributes['emit' + key.slice(3)] = value; //TODO: 
                  }
                  else validatedAttributes[key] = (isFunction(value) || isReined(value)) ? value : value instanceof Object ? readonly(value) : value;
                  break;

               case '_Ion':
                  if (!isIon(value)) {
                     throw new Error(`[INVALID INPUT] Value of '${key}' attribute must be an ion`)
                  }
                  validatedAttributes['$' + key] = isReined(value) ? value : readonly(value);
                  break;

               case 'MaybeIon':
                  validatedAttributes['$' + key] = isNamedDerivation(value) ? value : isIon(value) ? isReined(value) ? value : readonly(value) : readonly(toIon(value))
                  break;

               case '_Ionized':
                  if (!isIonizedModel(value)) {
                     throw new Error(`[INVALID INPUT] Value of '${key}' attribute must be an ionized`)
                  }
                  validatedAttributes['$' + key] = isReined(value) ? value : readonly(value);
                  break;

               case 'MaybeIonized':
                  validatedAttributes['$' + key] = isReined(value) ? value : readonly(value);
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
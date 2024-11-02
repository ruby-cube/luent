import { AnyObject } from "@rue/types";
import { MetaIonicModel } from "../../../quarky/src/ionize/MetaIonicModel";
import { AtomicIon, DerivedIon, isIon, isIonicModel, protect, WritableDerivedIon } from "@rue/quarky";
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
} & {
    [ATTRIBUTE_VALIDATION]?: C
}

//API
export function getAttributes<C extends { [key: string]: { validatedType: any } | ((arg: any) => { validatedType: any }) }>(typeConfig?: C): { [K in keyof ComponentAttributes<C>]: ComponentAttributes<C>[K] } {
    const attributes = getComponentAttributes()
    if (!attributes) throw new Error(`input function must be called as default parameter of component factory`)
    attributes[ATTRIBUTE_VALIDATION] = typeConfig;
    return attributes as ComponentAttributes<C>
}


//API
export function prep<C extends AnyObject>(attributes: ComponentAttributes<C>, assertions?: { [K in keyof C]?: ((value: any) => void) | ((value: any) => void)[] }): { [K in keyof ComponentValidatedInput<C>]: ComponentValidatedInput<C>[K] } {
    const typeConfig = attributes[ATTRIBUTE_VALIDATION];
    if (typeConfig || assertions) {
        const validatedAttributes = {} as AnyObject;

        for (const key in attributes) {
            let value = (<AnyObject>attributes)[key]
            if (assertions && assertions[key]) {
                const validation = assertions[key]
                const _assertions = validation instanceof Array ? validation : [validation]
                for (const assert of _assertions) {
                    assert(isIon(value) ? value() : value);
                }
            }
            if (typeConfig) {
                const config = typeConfig[key];

                if ('optional' in config && value === undefined && 'default' in config && config.default instanceof Function) {
                    value = config.default()
                }
                else if (!('optional' in config) && value === undefined) {
                    throw new Error(`[INVALID INPUT] Required component attribute, ${key}, is undefined`)
                }

                switch (config.name) {
                    case 'v':
                        if (isIon(value)) {
                            value = value()
                        }
                        if (key.startsWith('on:') && value instanceof Function) {
                            validatedAttributes['emit' + key.slice(3)] = value;
                        }
                        else validatedAttributes[key] = value; //TODO: make readonly
                        break;

                    case '_Ion':
                    case '$Ion':
                    case '$Ref':
                    case '_Ref':
                    case '$IonOrIon':
                        if (!isIon(value)) {
                            throw new Error(`[INVALID INPUT] Value of '${key}' attribute must be an ion`)
                        }
                        validatedAttributes['$' + key] = value; //TODO: make Ion read-only, protect $Ion
                        break;

                    case 'MaybeIon':
                        validatedAttributes['$' + key] = toIon(value) //TODO: make Ion read-only
                        break;

                    case '_Ionized':
                    case '$Ionized':
                    case '$IonizedOrIonized':
                        if (!isIonicModel(value)) {
                            throw new Error(`[INVALID INPUT] Value of '${key}' attribute must be an ionized`)
                        }
                        validatedAttributes['$' + key] = value; //TODO: readonly, protect
                        break;

                    case 'MaybeIonized':
                        validatedAttributes['$' + key] = value; //TODO: readonly
                        break;

                    default:
                        break;
                }
            }
        }
        return validatedAttributes as ComponentValidatedInput<C>
    }
    return attributes as ComponentValidatedInput<C>
}


// example:
// const input = getAttributes({
//     'on:IncrementClick': v<() => void>,
//     car: v<number>('??')(20),
//     frog: v<boolean>,
//     dog: v<number>('?'),
//     sun: Ion<number | string>,
//     stars: MaybeIon<number>('?'),
//     moon: $Ion<number | string, { setMoon(): void }>('?'),
// })

// const { emitIncrementClick, dog, car, frog, $sun, $moon, $stars } = prep(input)
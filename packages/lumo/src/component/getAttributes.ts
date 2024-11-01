import { AnyObject } from "@rue/types";
import { MetaIonicModel } from "../../../quarky/src/ionize/MetaIonicModel";
import { AtomicIon, DerivedIon, isIon, isIonicModel, protect, WritableDerivedIon } from "@rue/quarky";
import { META } from "../../../quarky/src/ReactiveEntity";
import { toIon } from "../../../quarky/src/ion/toIons";
import { getComponentAttributes } from "./makeComponent";

//TODO: Runtime check that only one of either e.g. $message or message attribute is passed in (not both)

export const v = ((optional: '?' | '??') => {
    function v(defaultValue: any) {
        return {
            name: 'v',
            // inputType: null,
            // attributeType: null,
            optional: 'withDefault',
            default: defaultValue
        }
    }
    v.optional = optional
    return v
}) as {
    <T>(optional?: '?' | '??'): {
        name: 'v',
        inputType: T;
        attributeType: T;
        optional: '?';
        default: undefined
    } & ((defaultValue: T) => {
        name: 'v',
        inputType: T;
        attributeType: T;
        optional: 'withDefault';
        default: true;
    }),
    name: 'v';
    required: true;
}

const _Ion = ((optional: '?') => {
    return {
        name: '_Ion',
        // inputType: null as unknown as Ion<any>,
        // attributeType: null as unknown as Ion<any>,
        optional,
        default: undefined
    }
}) as {
    <T>(optional: '?'): {
        name: '_Ion',
        inputType: Ion<T>;
        attributeType: Ion<T> | T;
        optional: '?';
        default: undefined
    },
    name: '_Ion';
    required: true;
}
export { _Ion as Ion }
export type Ion<T = any, M extends AnyObject = {}> = (() => T) & ((selected?: true) => T) & M


// export const MaybeIon = ((optional: '?' | (() => any)) => {
//     return {
//         name: 'MaybeIon',
//         inputType: null as unknown as Ion<any>,
//         attributeType: null as unknown as Ion<any>,
//         optional: optional as unknown as true,
//     }
// }) as {
//     <T>(optional: '?' | (() => any)): {
//         name: 'MaybeIon',
//         inputType: Ion<T>;
//         attributeType: Ion<T> | T;
//         optional: true
//     },
//     name: 'MaybeIon'
// }


export const MaybeIon = ((optional: '?' | '??') => {
    function MaybeIon(defaultValue: any) {
        return {
            name: 'MaybeIon',
            // inputType: null as unknown as Ion<any>,
            // attributeType: null,
            optional: 'withDefault',
            default: defaultValue
        }
    }
    MaybeIon.optional = optional
    return MaybeIon
}) as {
    <T>(optional?: '?' | '??'): {
        name: 'MaybeIon',
        inputType: Ion<T>;
        attributeType: Ion<T> | T;
        optional: '?';
        default: undefined
    } & ((defaultValue: T) => {
        name: 'MaybeIon',
        inputType: Ion<T>;
        attributeType: Ion<T> | T;
        optional: 'withDefault';
        default: true;
    }),
    name: 'MaybeIon';
    required: true;
}

export const $Ion = ((optional: '?') => {
    return {
        name: '$Ion',
        // inputType: null as unknown as Ion<any>,
        // $attributeType: null as unknown as Ion<any>,
        optional,
        default: undefined
    }
}) as {
    <T, M extends AnyObject>(optional: '?'): {
        name: '$Ion',
        inputType: Ion<T, M>;
        $attributeType: Ion<T, M>;
        optional: '?'
        default: undefined
    },
    name: '$Ion';
    required: true;
}

export const $IonOrIon = ((optional: '?') => {
    return {
        name: '$IonOrIon',
        // inputType: null as unknown as Ion<any>,
        // attributeType: null as unknown as Ion<any>,
        // $attributeType: null as unknown as Ion<any>,
        optional,
        default: undefined
    }
}) as {
    <T, M extends AnyObject>(optional: '?'): {
        name: '$IonOrIon',
        inputType: Ion<T> | Ion<T, M>;
        attributeType: Ion<T> | T;
        $attributeType: Ion<T, M>;
        optional: '?'
        default: undefined
    },
    name: '$IonOrIon';
    required: true;
}

export type Ionized<T extends AnyObject, M = {}> = {
    [K in keyof T]: T[K] extends AtomicIon<infer V> | DerivedIon<infer V> | WritableDerivedIon<infer V> ? V : T[K]
} & M & { [META]: MetaIonicModel }

const _Ionized = ((optional: '?') => {
    return {
        name: '_Ionized',
        // inputType: null as unknown as Ionized<any>,
        // attributeType: null as unknown as Ionized<any>,
        optional,
        default: undefined
    }
}) as {
    <T extends AnyObject>(optional: '?'): {
        name: '_Ionized',
        inputType: Ionized<T>;
        attributeType: Ionized<T>;
        optional: '?';
        default: undefined
    },
    name: '_Ionized';
    required: true;
}
export { _Ionized as Ionized }



export const MaybeIonized = ((optional: '?' | '??') => {
    function MaybeIonized(defaultValue: any) {
        return {
            name: 'MaybeIonized',
            // inputType: null as unknown as Ionized<any>,
            // attributeType: null,
            optional: 'withDefault',
            default: defaultValue
        }
    }
    MaybeIonized.optional = optional
    return MaybeIonized
}) as {
    <T extends AnyObject>(optional?: '?' | '??'): {
        name: 'MaybeIonized',
        inputType: Ionized<T>;
        attributeType: Ionized<T> | T;
        optional: '?';
        default: undefined
    } & ((defaultValue: T) => {
        name: 'MaybeIonized',
        inputType: Ionized<T>;
        attributeType: Ionized<T> | T;
        optional: 'withDefault';
        default: true;
    }),
    name: 'MaybeIonized';
    required: true;
}

export const $Ionized = ((optional: '?') => {
    return {
        name: '$Ionized',
        // inputType: null as unknown as Ionized<any>,
        // $attributeType: null as unknown as Ionized<any>,
        optional,
        default: undefined
    }
}) as {
    <T extends AnyObject, M>(optional: '?'): {
        name: '$Ionized',
        inputType: Ionized<T, M>;
        $attributeType: Ionized<T, M>;
        optional: '?'
        default: undefined
    },
    name: '$Ionized';
    required: true;
}

export const $IonizedOrIonized = ((optional: '?') => {
    return {
        name: '$IonizedOrIonized',
        // inputType: null as unknown as Ionized<any>,
        // attributeType: null as unknown as Ionized<any>,
        optional,
    }
}) as {
    <T extends AnyObject, M>(optional: '?'): {
        name: '$IonizedOrIonized',
        inputType: Ionized<T, M> | Ionized<T>;
        attributeType: Ionized<T>;
        $attributeType: Ionized<T, M>;
        optional: '?'
        default: undefined
    },
    name: '$IonizedOrIonized'
    required: true;
}

// class Bog {
//     boo: true = true
// }

// const attrs = {
//     num: v<number>('?'),
//     num2: v<number>,
//     messageB: MaybeIon<string | number>,
//     // message: _Ion<string>,
//     message: $IonOrIon<string, {
//         set(): void
//     }>('?'),
//     bog: v<Bog>,
//     flora: $Ionized<{
//         petal: string
//     }, {
//         setPetals(): void
//     }>
// }




export const ATTRIBUTE_VALIDATION = Symbol('attribute-validation')

// const attributes = $input(attrs)
// const input = prep(attributes)

//TODO: transform slot render function to Slot component

type ComponentInput<C> = {
    [K in keyof C as C[K] extends { required: true } | { default: true } ? K extends `on:${infer S}` ? `emit${S}` : C[K] extends {
        name: '_Ion' | '_Ionized' | 'MaybeIonized' | 'MaybeIon' | '$IonOrIon' | '$IonizedOrIonized' | '$Ion' | '$Ionized'
    } ? K extends string ? `$${K}` : K : K : never]:

    C[K] extends { inputType: infer I } | ((arg: any) => { inputType: infer I }) ? I
    : 'invalid typeConfig'
} & {
    [K in keyof C as C[K] extends { optional: '?' } ? K extends `on:${infer S}` ? `emit${S}` : C[K] extends {
        name: '_Ion' | '_Ionized' | 'MaybeIonized' | 'MaybeIon' | '$IonOrIon' | '$IonizedOrIonized' | '$Ion' | '$Ionized'
    } ? K extends string ? `$${K}` : K : K : never]?:

    C[K] extends { inputType: infer I } | ((arg: any) => { inputType: infer I }) ? I
    : 'invalid typeConfig'
}


type ComponentAttributes<C> = {
    [K in keyof C as C[K] extends { required: true } & ((arg: any) => { attributeType: any }) ? K : never]:
    C[K] extends ((arg: any) => { attributeType: infer I }) ? I : 'invalid typeConfig'
} & {
    [K in keyof C as C[K] extends { optional: '?' | 'withDefault', attributeType: any } ? K : never]?:
    C[K] extends { attributeType: infer I } ? I : 'invalid typeConfig'
} & {
    [K in keyof C as C[K] extends { name: '$IonOrIon' | '$IonizedOrIonized' | '$Ionized' | '$Ion'; required: true } & ((arg: any) => { $attributeType: any }) ? K extends string ? `$${K}` : never : never]:
    C[K] extends (arg: any) => { $attributeType: infer I } ? I : 'invalid typeConfig'
} & {
    [K in keyof C as C[K] extends { name: '$IonOrIon' | '$IonizedOrIonized' | '$Ionized' | '$Ion'; optional: '?' | 'withDefault' } ? K extends string ? `$${K}` : never : never]?:
    C[K] extends { $attributeType: infer I } ? I : 'invalid typeConfig'
} & {
    [ATTRIBUTE_VALIDATION]?: C
}

//API
export function getAttributes<C extends { [key: string]: { inputType: any } | ((arg: any) => { inputType: any }) }>(typeConfig?: C): { [K in keyof ComponentAttributes<C>]: ComponentAttributes<C>[K] } {
    const attributes = getComponentAttributes()
    if (!attributes) throw new Error(`input function must be called as default parameter of component factory`)
    attributes[ATTRIBUTE_VALIDATION] = typeConfig;
    return attributes as ComponentAttributes<C>
}


//API
export function prep<C extends AnyObject>(attributes: ComponentAttributes<C>, assertions?: { [K in keyof C]?: ((value: any) => void) | ((value: any) => void)[] }): { [K in keyof ComponentInput<C>]: ComponentInput<C>[K] } {
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
        return validatedAttributes as ComponentInput<C>
    }
    return attributes as ComponentInput<C>
}

const inpu = getAttributes({
    'on:IncrementClick': v<() => void>,
    car: v<number>('??')(20),
    frog: v<boolean>,
    dog: v<number>('?'),
})

const { emitIncrementClick, dog, car } = prep(inpu)
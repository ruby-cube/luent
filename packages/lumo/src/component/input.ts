import { AnyObject } from "@rue/types";
import { MetaIonicModel } from "../../../quarky/src/ionize/MetaIonicModel";
import { AtomicIon, DerivedIon, WritableDerivedIon } from "@rue/quarky";
import { META } from "../../../quarky/src/ReactiveEntity";

//TODO: Runtime check that only one of either e.g. $message or message attribute is passed in (not both)

export const v = ((optional: '?' | (() => any)) => {
    return {
        name: 'v',
        inputType: null,
        attributeType: null,
        optional: optional as unknown as true,
    }
}) as {
    <T>(optional: '?' | (() => any)): {
        name: 'v',
        inputType: T;
        attributeType: T;
        optional: true
    },
    name: 'v'
}

const _Ion = ((optional: '?') => {
    return {
        name: '_Ion',
        inputType: null as unknown as Ion<any>,
        attributeType: null as unknown as Ion<any>,
        optional: optional as unknown as true,
    }
}) as {
    <T>(optional: '?'): {
        name: '_Ion',
        inputType: Ion<T>;
        attributeType: Ion<T>;
        optional: true
    },
    name: '_Ion'
}
export { _Ion as Ion }
export type Ion<T = any, M extends AnyObject = {}> = (() => T) & ((selected?: true) => T) & M


export const MaybeIon = ((optional: '?' | (() => any)) => {
    return {
        name: 'MaybeIon',
        inputType: null as unknown as Ion<any>,
        attributeType: null as unknown as Ion<any>,
        optional: optional as unknown as true,
    }
}) as {
    <T>(optional: '?' | (() => any)): {
        name: 'MaybeIon',
        inputType: Ion<T>;
        attributeType: Ion<T> | T;
        optional: true
    },
    name: 'MaybeIon'
}

export const $Ion = ((optional: '?') => {
    return {
        name: '$Ion',
        inputType: null as unknown as Ion<any>,
        $attributeType: null as unknown as Ion<any>,
        optional: optional as unknown as true,
    }
}) as {
    <T, M extends AnyObject>(optional: '?' | (() => any)): {
        name: '$Ion',
        inputType: Ion<T, M>;
        $attributeType: Ion<T, M>;
        optional: true
    },
    name: '$Ion'
}

export const Maybe$Ion = ((optional: '?') => {
    return {
        name: 'Maybe$Ion',
        inputType: null as unknown as Ion<any>,
        attributeType: null as unknown as Ion<any>,
        $attributeType: null as unknown as Ion<any>,
        optional: optional as unknown as true,
    }
}) as {
    <T, M extends AnyObject>(optional: '?'): {
        name: 'Maybe$Ion',
        inputType: Ion<T> | Ion<T, M>;
        attributeType: Ion<T>;
        $attributeType: Ion<T, M>;
        optional: true
    },
    name: 'Maybe$Ion'
}

export type Ionized<T extends AnyObject, M = {}> = {
    [K in keyof T]: T[K] extends AtomicIon<infer V> | DerivedIon<infer V> | WritableDerivedIon<infer V> ? V : T[K]
} & M & { [META]: MetaIonicModel }

const _Ionized = ((optional: '?') => {
    return {
        name: '_Ionized',
        inputType: null as unknown as Ionized<any>,
        attributeType: null as unknown as Ionized<any>,
        optional: optional as unknown as true,
    }
}) as {
    <T extends AnyObject>(optional: '?'): {
        name: '_Ionized',
        inputType: Ionized<T>;
        attributeType: Ionized<T>;
        optional: true
    },
    name: '_Ionized'
}
export { _Ionized as Ionized }



export const MaybeIonized = ((optional: '?' | (() => any)) => {
    return {
        name: 'MaybeIonized',
        inputType: null as unknown as Ionized<any>,
        attributeType: null as unknown as Ionized<any>,
        optional: optional as unknown as true,
    }
}) as {
    <T extends AnyObject>(optional: '?' | (() => any)): {
        name: 'MaybeIonized',
        inputType: Ionized<T>;
        attributeType: Ionized<T> | T;
        optional: true
    },
    name: 'MaybeIonized'
}

export const $Ionized = ((optional: '?') => {
    return {
        name: '$Ionized',
        inputType: null as unknown as Ionized<any>,
        $attributeType: null as unknown as Ionized<any>,
        optional: optional as unknown as true,
    }
}) as {
    <T extends AnyObject, M>(optional: '?'): {
        name: '$Ionized',
        inputType: Ionized<T, M>;
        $attributeType: Ionized<T, M>;
        optional: true
    },
    name: '$Ionized'
}

export const Maybe$Ionized = ((optional: '?') => {
    return {
        name: 'Maybe$Ionized',
        inputType: null as unknown as Ionized<any>,
        attributeType: null as unknown as Ionized<any>,
        optional: optional as unknown as true,
    }
}) as {
    <T extends AnyObject, M>(optional: '?'): {
        name: 'Maybe$Ionized',
        inputType: Ionized<T, M> | Ionized<T>;
        attributeType: Ionized<T>;
        $attributeType: Ionized<T, M>;
        optional: true
    },
    name: 'Maybe$Ionized'
}

class Bog {
    boo: true = true
}

const attrs = {
    num: v<number>('?'),
    num2: v<number>,
    messageB: MaybeIon<string | number>,
    // message: _Ion<string>,
    message: Maybe$Ion<string, {
        set(): void
    }>('?'),
    bog: v<Bog>,
    flora: $Ionized<{
        petal: string
    }, {
        setPetals(): void
    }>
}




const COMPONENT_ATTRIBUTES = Symbol('component-attributes')

const inp = input(attrs)
const attribs = input(attrs)[COMPONENT_ATTRIBUTES]




type ComponentInput<C> = {
    [K in keyof C as C[K] extends {
        name: '_Ion' | '_Ionized' | 'MaybeIonized' | 'MaybeIon' | 'Maybe$Ion' | 'Maybe$Ionized' | '$Ion' | '$Ionized'
    } ? K extends string ? `$${K}` : K : K]:

    C[K] extends { inputType: infer I } | ((arg: any) => { inputType: infer I }) ? I
    : 'invalid typeConfig'
} & {
    [COMPONENT_ATTRIBUTES]: { [K in keyof ComponentAttributes<C>]: ComponentAttributes<C>[K] }
}


type ComponentAttributes<C> = {
    [K in keyof C as C[K] extends (arg: any) => { attributeType: any } ? K : never]:
    C[K] extends ((arg: any) => { attributeType: infer I }) ? I : 'invalid typeConfig'
} & {
    [K in keyof C as C[K] extends { optional: true } ? K : never]?:
    C[K] extends { attributeType: infer I } ? I : 'invalid typeConfig'
} & {
    [K in keyof C as C[K] extends { name: 'Maybe$Ion' | 'Maybe$Ionized' | '$Ionized' | '$Ion' } & ((arg: any) => object) ? K extends string ? `$${K}` : never : never]:
    C[K] extends (arg: any) => { $attributeType: infer I } ? I : 'invalid typeConfig'
} & {
    [K in keyof C as C[K] extends { name: 'Maybe$Ion' | 'Maybe$Ionized' | '$Ionized' | '$Ion' } & { optional: true } ? K extends string ? `$${K}` : never : never]?:
    C[K] extends { $attributeType: infer I } ? I : 'invalid typeConfig'
}

export function input<C>(typeConfig?: C): { [K in keyof ComponentInput<C>]: ComponentInput<C>[K] } {
    const attributes = getComponentAttributes() as ComponentInput<C>

    if (typeConfig) {
        for (const key in attributes) {

        }
    }

    return attributes;
}

//TODO: move to makeComponent.ts and implement
function getComponentAttributes() {
    return {}
}
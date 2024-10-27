import type { Ionized, Ion } from "@rue/quarky";
import { AnyObject } from "@rue/types";

export const Val = ((optional?: '?' | (() => any)) => {
    return {
        name: 'Val',
        type: null,
        optional: true,
    }
}) as {
    <T>(optional?: '?' | (() => any)): {
        type: T;
        optional: true
    },
    name: 'Val'
}

const _Ion = ((optional?: '?' | (() => any)) => {
    return {
        name: '_Ion',
        type: null as unknown as Ion<any>,
        optional: true,
    }
}) as {
    <T>(optional?: '?' | (() => any)): {
        type: Ion<T>;
        optional: true
    },
    name: '_Ion'
}
export { _Ion as Ion }

export const MaybeIon = ((optional?: '?' | (() => any)) => {
    return {
        name: 'MaybeIon',
        type: null as unknown as Ion<any>,
        optional: true,
    }
}) as {
    <T>(optional?: '?' | (() => any)): {
        type: Ion<T> | T;
        optional: true
    },
    name: 'MaybeIon'
}

export const $Ion = ((optional?: '?') => {
    return {
        name: '$Ion',
        type: null as unknown as Ion<any>,
        optional: true,
    }
}) as {
    <T, M extends AnyObject>(optional?: '?' | (() => any)): {
        type: Ion<T, M>;
        optional: true
    },
    name: '$Ion'
}


const attrs = {
    num: Val<number>('?'),
    num2: Val<number>,
    message: _Ion<string>,
    messageB: $Ion<string, {
        set(): void
    }>
}

const inp = input(attrs)


type MaybeIon<T = any> = T | Ion<T>

type MaybeIonized<T extends AnyObject = AnyObject> = T | Ionized<T>;


type TypedInput<T> = {
    [K in keyof T as T[K] extends {
        name: 'MaybeIon' | 'Ion' | 'Ionized' | '$Ion' | 'MaybeIonized' | '$Ionized'
    } & ({ type: infer I } | (() => { type: infer I })) ? K extends string ? `$${K}` : K : K]:

    T[K] extends { type: infer I } | (() => { type: infer I }) ? I : 'i dunno'
}

export function input<C>(typeConfig?: C): { [K in keyof TypedInput<C>]: TypedInput<C>[K] } {
    const attributes = getComponentAttributes() as TypedInput<C>

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
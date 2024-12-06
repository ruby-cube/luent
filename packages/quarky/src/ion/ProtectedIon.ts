import { AnyObject } from "@rue/types";
import { META } from "../ReactiveEntity";
import { asMetaIon, AtomicIon, MetaIon } from "./AtomicIon";
import { isIonizedModel } from "../ionize/ionize";
import { protectIonicModel } from "../ionize/ProtectedIonicModel";

export const IS_PUBLIC = Symbol('is_public')

export type ProtectedIon<T = any, M extends AnyObject = {}> = {
    (selected?: true): T;
    [META]: { inert: boolean, o: any, asReadonly?: ProtectedIon, asProtected?: ProtectedIon };
} & M
export const READONLY = 'ro'

// protected ion: no set function 
// readonly ion: no methods
// custom protected ion: no set function and only select properties and methods 

type WritableIon<T = any, M = AnyObject> = ((selected?: true) => T) & {
    [META]: MetaWritableIon
} & M

// ion | WritableDerivedIon | PropIon //TODO: make this into an interface instead
type MetaWritableIon = {
    inert: boolean;
    o: any;
    asReadonly?: any
    asProtected?: any
    hasMethods: boolean
}

export function isWritableIon(value: any): value is WritableIon {
    if (!(value instanceof Object)) return false;
    return META in value && 'asReadonly' in value[META]
}

export type Public = {
    [IS_PUBLIC]?: true
} & (() => any)

type _ProtectedIon<I> = I extends WritableIon<infer T, infer M> ? ProtectedIon<T, { [K in keyof M as M[K] extends (this: infer P, ...args: any[]) => any ? P extends Public ? K extends `${infer S}XPO` ? S : K : never: never]: M[K] }> : Omit<I, 'as'>
// I & {[K in keyof M as M[K] extends (this: Public)=>any ? K : never]: M[K]}
/**
 * methodKeys: methodKeys to include in protected ion
 */
export function protectIon<I extends WritableIon>($ion: I, methodKeys?: { [key: string]: true } | typeof READONLY): _ProtectedIon<I> {
    if (!methodKeys && isCustomProtectedIon($ion)) {
        return $ion;
    }
    if (!methodKeys && asMetaIon($ion).hasMethods) {
        return asProtectedIon($ion);
    }

    if (methodKeys === READONLY || !methodKeys) {
        return asReadonlyIon($ion)
    }

    return asCustomProtectedIon($ion, methodKeys)
}


function asCustomProtectedIon($ion: WritableIon, methodKeys: { [key: string]: true }) {
    if (isReadonlyIon($ion)) return $ion;
    return createCustomProtectedIon($ion, methodKeys)
}

function createCustomProtectedIon($ion: WritableIon, methodKeys: { [key: string]: true }) {
    const meta = asMetaIon($ion);
    const $coreIon = meta.o;
    const proto = Object.getPrototypeOf($coreIon)
    function $customIon(selected: boolean) {
        const value = $coreIon(selected)
        if (isIonizedModel(value)) {
            return protectIonicModel(value)
        }
        return value;
    }

    if (__DEV__ && 'as' in methodKeys && !('_as' in $coreIon)) {
        console.warn(`'as' function cannot be included in a protected ion unless it is an override`)
    }

    const setterKey = '_as' in $coreIon ? '_as' : 'as'

    //@ts-expect-error
    $customIon[setterKey] = protectedMethod;
    for (const key in proto) {
        if (!(key in methodKeys)) {
            (<AnyObject>$customIon)[key] = protectedMethod
        }
    }

    Object.setPrototypeOf($customIon, proto)

    return $customIon;
}

export function protectedMethod() {
    if (__DEV__) console.warn(`[PROTECTED METHOD] Operation failed.`)
}

function isCustomProtectedIon($ion: AnyObject) {
    return $ion.as === protectedMethod || $ion._as === protectedMethod
}

function asReadonlyIon($ion: WritableIon) {
    if (isReadonlyIon($ion)) return $ion;
    const meta = asMetaIon($ion);
    const existing = meta.asReadonly;
    if (existing) return existing;
    return createReadonlyIon(meta);
}

function createReadonlyIon(meta: MetaWritableIon) {
    const $coreIon = meta.o

    function $readonlyIon(selected?: boolean) {
        const value = $coreIon(selected)
        if (isIonizedModel(value))
            return protectIonicModel(value, READONLY)
        return value;
    }
    $readonlyIon[META] = meta;

    meta.asReadonly = $readonlyIon;
    return $readonlyIon;
}


function asProtectedIon($ion: WritableIon) {
    if (isProtectedIon($ion) || isReadonlyIon($ion)) {
        return $ion
    }
    const meta = asMetaIon($ion)
    const existing = meta.asProtected
    if (existing) {
        return existing;
    }
    return createProtectedIon(meta);
}

function createProtectedIon(meta: MetaWritableIon) {
    const $coreIon = meta.o

    const proto = Object.getPrototypeOf($coreIon)

    function $protectedIon(selected?: boolean) {
        const value = $coreIon(selected)
        if (isIonizedModel(value)) {
            return protectIonicModel(value)
        }
        return value;
    }

    // const setterKey = '_as' in $coreIon ? '_as' : 'as'

    // //@ts-expect-error
    // $protectedIon[setterKey] = () => {
    //     throw new Error(`Set operation failed. Ion is protected`)
    //     console.warn(`Set operation failed. Ion is protected`)
    // }

    for (const key in proto) {
        const method = proto[key];
        if (!(IS_PUBLIC in method)) {
            //@ts-expect-error
            $protectedIon[key] = () => {
                throw new Error(`'${key}()' method failed. Must be marked /* public */ to be used in protected ion`)
                console.warn(`${key} method failed. Must be marked /* public */ to be used in protected ion`)
            }
        }
    }

    Object.setPrototypeOf($protectedIon, proto)

    meta.asProtected = $protectedIon
    return $protectedIon
}

function isProtectedIon($ion: WritableIon) {
    const meta = asMetaIon($ion)
    return meta.asProtected === $ion
}

function isReadonlyIon($ion: WritableIon) {
    const meta = asMetaIon($ion)
    return meta.asReadonly === $ion
}
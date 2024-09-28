import { AnyObject } from "@rue/types";
import { WritableDerivedIon } from "../derivations/DerivedIon";
import { META } from "../ReactiveEntity";
import { asMetaIon, ReactiveIon, MetaIon } from "./ReactiveIon";
import { AnyIon, isAnyIon } from "./AnyIon";
import { PropIon } from "../ionize/PropIon";

export type ProtectedIon<T = any, M extends AnyObject = {}> = {
    (): T;
    [META]: { o: any, asReadonly?: ProtectedIon, asProtected?: ProtectedIon };
} & M
export const READONLY = 'ro'

// protected ion: no set function 
// readonly ion: no methods
// custom protected ion: no set function and only select properties and methods 

type WritableIon = {
    [META]: MetaWritableIon
}

// ReactiveIon | WritableDerivedIon | PropIon //TODO: make this into an interface instead
type MetaWritableIon = {
    o: any;
    asReadonly?: any
    asProtected?: any
    hasMethods: boolean
}

export function isWritableIon(value: any):value is WritableIon {
    if (!(value instanceof Object)) return false;
    return META in value && 'asReadonly' in value[META]
}

/**
 * methodKeys: methodKeys to include in protected ion
 */
export function protectIon($ion: WritableIon, methodKeys?: { [key: string]: true } | typeof READONLY) {
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
    function $customIon() {
        return $coreIon()
    }

    if (__DEV__ && 'set' in methodKeys) {
        console.warn(`'set' function cannot be included in a protected ion.`)
    }

    const customProto = Object.create(proto)
    customProto.set = protectedMethod;
    for (const key in proto) {
        if (!(key in methodKeys)) {
            customProto[key] = protectedMethod
        }
    }

    Object.setPrototypeOf($customIon, customProto)

    return $customIon;
}

export function protectedMethod() {
    if (__DEV__) console.warn(`[PROTECTED METHOD] Operation failed.`)
}

function isCustomProtectedIon($ion: AnyObject) {
    return $ion.set === protectedMethod;
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

    function $readonlyIon() {
        return $coreIon()
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

    const proto = Object.create(Object.getPrototypeOf($coreIon))
    proto.set = () => {
        console.warn(`Set operation failed. Ions cannot be set outside of their own methods`)
    }

    function $protectedIon() {
        return $coreIon()
    }

    Object.setPrototypeOf($protectedIon, proto)

    meta.asProtected = $protectedIon as ProtectedIon
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
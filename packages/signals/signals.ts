//-@ts-nocheck
import { ComputedRef, Ref, ShallowRef, computed, isRef, reactive, shallowReactive, shallowRef, triggerRef } from "vue";


export type Signal<T> = () => T;

type PrivateSignal<T> = {
    (): T;
    _ref: ShallowRef<T>;
    _type: SignalType;
}

const _SIGNALIZED_ = Symbol("signalized");

const SIGNAL = 0 as const;
const SHALLOW = 1 as const;
const DEEP = 2 as const;

type SignalType = typeof SIGNAL | typeof SHALLOW | typeof DEEP;


export function $<T>(value: T, _type?: SignalType): Signal<T> {
    const ref = shallowRef(value);
    const signal = () => ref.value;
    signal._ref = ref;
    signal._type = _type;
    return signal;
}


export function computed$<F extends () => any>(computation: F) {
    const computedRef = computed(computation);
    return () => computedRef.value;
}

type Unsignalized<T> = T extends { [_SIGNALIZED_]: true } ? { [Key in keyof T as Key extends `${infer K}$` ? K : never]: T[Key] extends () => any ? Unsignalized<ReturnType<T[Key]>> : Unsignalized<T[Key]> } : T; //TODO:

export function $set<T>(signal: Signal<T>, valueOrManipulator: T | ((value: T) => T) | Unsignalized<T>) {
    const ref = (<PrivateSignal<T>>signal)._ref;
    const type = (<PrivateSignal<T>>signal)._type;
    const currentValue = ref.value;
    if (isManipulator(valueOrManipulator, currentValue)) {
        validateManipulation(currentValue);
        const manipulate = valueOrManipulator;
        manipulate(currentValue);
    }
    else {
        const value = valueOrManipulator;
        if (type === DEEP && !(_SIGNALIZED_ in (<Object>value))) {
            //@ts-expect-error
            ref.value = deepSignalize(value);
        }
        else if (type === SHALLOW && !(_SIGNALIZED_ in (<Object>value))) {
            //@ts-expect-error
            ref.value = signalize(value);
        }
        else {
            //@ts-expect-error
            ref.value = value; //TODO: 
        }
    }
}

function isManipulator(valueOrManipulator: unknown | ((value: unknown) => unknown), value: unknown): valueOrManipulator is (value: unknown) => unknown {
    return typeof valueOrManipulator === "function" && typeof value !== "function";
}

function validateManipulation(value: any) {
    if (value instanceof Object) throw new Error("Cannot `$set` non-primitives. Use `$mutate` instead.")
}


type Signalizable<T extends { [key: string]: any }> = T extends any[] ? never : T extends Map<any, any> ? never : T extends Set<any> ? never : T extends { [key: string]: any } ? T : never;

export function signalize<T extends { [key: string]: any }>(obj: Signalizable<T>): T extends Signalizable<T> ? { [Key in keyof T as Key extends string ? `${Key}$` : never]: Signal<T[Key]> } & { [_SIGNALIZED_]: true } : never {
    validateSignalizeInput(obj);
    const signalObj = { [_SIGNALIZED_]: true };
    for (const key in obj) {    //TODO: see if proxy implementation would be more performant
        //@ts-expect-error
        signalObj[genSignalKey(key)]
            = $(obj[key])
    }
    //@ts-expect-error
    return signalObj;
}

export function signalize$<T extends { [key: string]: any }>(obj: Signalizable<T>) {
    return $(signalize(obj), SHALLOW);
}


type DeepSignalized$<T> = Signal<{
    [Key in keyof T as Key extends string ? `${Key}$` : never]: T[Key] extends Signalizable<{ [key: string]: any }> ? DeepSignalized$<T[Key]> : Signal<T[Key]>;
} & { [_SIGNALIZED_]: true }>

export function deepSignalize<T extends { [key: string]: any }>(obj: Signalizable<T>): T extends Signalizable<T> ? { [Key in keyof T as Key extends string ? `${Key}$` : never]: T[Key] extends Signalizable<T[Key]> ? DeepSignalized$<T[Key]> : Signal<T[Key]> } & { [_SIGNALIZED_]: true } : never {
    validateSignalizeInput(obj);
    const signalObj = { [_SIGNALIZED_]: true };
    for (const key in obj) {
        const value = obj[key];
        if (isSignalizable(value)) {
            //@ts-expect-error
            signalObj[genSignalKey(key)]
                = deepSignalize$(obj[key])
        }
        else {
            //@ts-expect-error
            signalObj[genSignalKey(key)]
                = $(value);
        }
    }
    //@ts-expect-error
    return signalObj;
}


export function deepSignalize$<T extends { [key: string]: any }>(obj: Signalizable<T>): T extends Signalizable<T> ? DeepSignalized$<T> : Signal<T> {
    //@ts-expect-error
    return $(deepSignalize(obj), DEEP);
}


export function $mutate<T extends Object>(mutable$: Signal<T>, mutation: (iterable: T) => void) {
    const iterable = mutable$();
    mutation(iterable);
    triggerRef((<PrivateSignal<T>>mutable$)._ref);
}



function genSignalKey<K extends string>(key: K): `${K}$` {
    return `${key}$`;
}

function validateSignalizeInput(input: any): asserts input is { [key: string]: any } {
    if (!(input instanceof Object) || isNonSignalizableObject(input))
        throw new Error("Signalize must take in a non-iterable object")
}

function isSignalizable(input: any) {
    return input instanceof Object && !isNonSignalizableObject(input);
}

function isNonSignalizableObject(input: any) {
    return input instanceof Array || input instanceof Set || input instanceof Map
}









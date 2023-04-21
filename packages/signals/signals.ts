//-@ts-nocheck
import { ComputedRef, Ref, ShallowRef, computed, isRef, reactive, shallowReactive, shallowRef, triggerRef } from "vue";


export type Signal<T> = () => T;

type PrivateSignal<T> = {
    (): T;
    _ref: ShallowRef<T>;
}


export function $<T>(value: T): Signal<T> {
    const ref$ = shallowRef(value);
    const getter = () => ref$.value;
    getter._ref = ref$;
    return getter;
}


export function computed$<F extends () => any>(computation: F) {
    const c = computed(computation);
    return () => c.value;
}

export function $set<T>(signal: Signal<T>, valueOrManipulator: T) {
    const isManipulator = typeof valueOrManipulator === "function" && typeof (<PrivateSignal<T>>signal)._ref.value !== "function";
    if (isManipulator) {
        const manipulate = valueOrManipulator;
        manipulate((<PrivateSignal<T>>signal)._ref.value) //TODO:
    }
    else {
        const value = valueOrManipulator;
        (<PrivateSignal<T>>signal)._ref.value = value; //TODO: 
    }
}



export function signalize<T extends { [key: string]: any }>(obj: T) {
    validateSignalizeInput(obj);
    const signalObj = {} as { [Key in keyof T as Key extends string ? `${Key}$` : never]: Signal<T[Key]> }
    for (const key in obj) {    //TODO: see if proxy implementation would be more performant
        //@ts-expect-error
        signalObj[genSignalKey(key)] = $(obj[key])
    }
    return signalObj;
}

export function signalize$<T extends { [key: string]: any }>(obj: T) {
    return $(signalize(obj));
}

type DeepSignalized$<T> = Signal<{ [Key in keyof T as Key extends string ? `${Key}$` : never]: T[Key] extends { [key: string]: any } ? DeepSignalized$<T[Key]> : Signal<T[Key]> }>

export function deepSignalize<T>(obj: T): { [Key in keyof T as Key extends string ? `${Key}$` : never]: T[Key] extends { [key: string]: any } ? DeepSignalized$<T[Key]> : Signal<T[Key]> } {
    validateSignalizeInput(obj);
    const signalObj = {};
    for (const key in obj) {
        //@ts-expect-error
        signalObj[genSignalKey(key)] = deepSignalize$(obj[key])
    }
    //@ts-expect-error
    return signalObj;
}

export function deepSignalize$<T>(obj: T): T extends { [key: string]: any } ? DeepSignalized$<T> : Signal<T> {
    //@ts-expect-error
    return $(deepSignalize(obj));
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
    if (!(input instanceof Object) || input instanceof Array || input instanceof Set || input instanceof Map)
        throw new Error("Signalize must take in a non-iterable object")
}












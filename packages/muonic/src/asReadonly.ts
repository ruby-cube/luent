import { isAtomicSignal, AtomicSignal } from "./$Signal";
import { isReactiveModel, ReactiveModel } from "./reactivemodel/Reactive$";


export type ReadonlySignal<T = any> = {
    (): T;
    [READONLY_SIGNAL]: true
}

export const READONLY_SIGNAL = Symbol('readonly signal');

export function asReadonly<R extends AtomicSignal<T> | ReactiveModel, T>(reactiveRef: R): R extends AtomicSignal ? ReadonlySignal<T> : R {
    if (isAtomicSignal(reactiveRef)) {
        const readonlySignal = () => reactiveRef()
        readonlySignal[READONLY_SIGNAL] = true;
        return readonlySignal as R extends AtomicSignal ? ReadonlySignal<T> : R
    }
    if (isReactiveModel(reactiveRef)) {
        //TODO: 
        return reactiveRef as R extends AtomicSignal ? ReadonlySignal<T> : R;
    }
    return reactiveRef;
}



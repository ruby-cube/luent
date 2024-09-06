import { isSignal, Signal } from "./$Signal";
import { isReactiveModel, ReactiveModel } from "./reactivemodel/Reactive$";


export type ReadonlySignal<T = any> = {
    (): T;
    [READONLY_SIGNAL]: true
}

export const READONLY_SIGNAL = Symbol('readonly signal');

export function asReadonly<R extends Signal<T> | ReactiveModel, T>(reactiveRef: R): R extends Signal ? ReadonlySignal<T> : R {
    if (isSignal(reactiveRef)) {
        const readonlySignal = () => reactiveRef()
        readonlySignal[READONLY_SIGNAL] = true;
        return readonlySignal as R extends Signal ? ReadonlySignal<T> : R
    }
    if (isReactiveModel(reactiveRef)) {
        //TODO: 
        return reactiveRef as R extends Signal ? ReadonlySignal<T> : R;
    }
    return reactiveRef;
}



import { isSignal, AtomicSignal } from "./Signal";
import { isReactiveModel, ReactiveModel } from "./reactivemodel/ReactiveModel";
import { META, ReactiveEntity } from "./ReactiveEntity";


export type ReadonlySignal<T = any> = {
    (): T;
    [READONLY_SIGNAL]: true
    [META]: ReactiveEntity
}

export const READONLY_SIGNAL = Symbol('readonlySignal');

export function asReadonly<R extends AtomicSignal<T> | ReactiveModel, T>(reactiveRef: R): R extends AtomicSignal ? ReadonlySignal<T> : R {
    if (isSignal(reactiveRef)) {
        const readonlySignal = () => reactiveRef()
        readonlySignal[META] = reactiveRef[META]
        readonlySignal[READONLY_SIGNAL] = true;
        return readonlySignal as R extends AtomicSignal ? ReadonlySignal<T> : R
    }
    if (isReactiveModel(reactiveRef)) {
        //TODO: 
        return reactiveRef as R extends AtomicSignal ? ReadonlySignal<T> : R;
    }
    return reactiveRef;
}



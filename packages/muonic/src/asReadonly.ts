import { isIon, AtomicIon } from "./Ion";
import { isReactiveModel, ReactiveModel } from "./reactivemodel/ReactiveModel";
import { META, ReactiveEntity } from "./ReactiveEntity";


export type ReadonlyIon<T = any> = {
    (): T;
    [READONLY_ION]: true
    [META]: ReactiveEntity
}

export const READONLY_ION = Symbol('readonlySignal');

export function asReadonly<R extends AtomicIon<T> | ReactiveModel, T>(reactiveRef: R): R extends AtomicIon ? ReadonlyIon<T> : R {
    if (isIon(reactiveRef)) {
        const readonlySignal = () => reactiveRef()
        readonlySignal[META] = reactiveRef[META]
        readonlySignal[READONLY_ION] = true;
        return readonlySignal as R extends AtomicIon ? ReadonlyIon<T> : R
    }
    if (isReactiveModel(reactiveRef)) {
        //TODO: 
        return reactiveRef as R extends AtomicIon ? ReadonlyIon<T> : R;
    }
    return reactiveRef;
}



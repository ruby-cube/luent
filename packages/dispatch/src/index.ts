import { TypedKey } from "@rue/lumo";
import { AnyObject } from "@rue/types";


type DispatchConfig = {
    GET?: (specifiers?: AnyObject) => Promise<any> //TODO: understand specifiers
    PATCH?: (patch: AnyObject, specifiers?: AnyObject) => Promise<unknown>
    PUT?: (value: any, specifiers?: AnyObject) => Promise<unknown>
    POST?: (value: any, specifiers?: AnyObject) => Promise<unknown>
    DELETE?: (specifiers?: AnyObject) => Promise<unknown>
}

const dispatchMap: Map<TypedKey<unknown>, DispatchConfig> = new Map()

export function defineDispatch(key: TypedKey<any>, config: DispatchConfig) { //TODO: lazy define and clean up on unmounted (count subscribers and unmount on last unmount)
    if (dispatchMap.get(key)) {
        if (__DEV__) throw new Error("Dispatch already defined for this key")
        return;
    }
    dispatchMap.set(key, config);
}


export function dispatchPUT<T>(key: TypedKey<T>, value: T, specifiers: AnyObject): Promise<T> {
    return _dispatch('PUT', key, specifiers, value)
}

export function dispatchPATCH<T>(key: TypedKey<T>, patch: AnyObject, specifiers: AnyObject): Promise<T> {
    return _dispatch('PATCH', key, specifiers, patch)
}

export function dispatchPOST<T>(key: TypedKey<T>, value: T, specifiers: AnyObject): Promise<T> {
    return _dispatch('POST', key, specifiers, value)
}

export function dispatchGET<T>(key: TypedKey<T>, specifiers: AnyObject): Promise<T> {
    return _dispatch('GET', key, specifiers)
}

export function dispatchDELETE<T>(key: TypedKey<T>, specifiers: AnyObject): Promise<T> {
    return _dispatch('DELETE', key, specifiers)
}

function _dispatch(type: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', key: TypedKey<any>, specifiers: AnyObject | undefined, arg?: any) {
    const config = dispatchMap.get(key)
    const op = config?.[type];
    if (!config || !op) {
        if (__DEV__) throw new Error(`No dispatch config or ${type} function found for this key. Register key with 'defineDispatch'.`);
        return new Promise((resolve, reject) => {
            reject(`No dispatch config or ${type} function found for this key`)
        })
    }
    if (type === 'GET' || type === 'DELETE')
        return op(specifiers!);
    return op(arg!, specifiers)
}


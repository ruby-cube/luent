import { isIon, AtomicIon } from "./ion/AtomicIon";
import { isIonicModel, IonicModel } from "./ionize/IonicModel";
import { META, ReactiveEntity } from "./ReactiveEntity";


export type ReadonlyIon<T = any> = {
    (): T;
    [READONLY_ION]: true
    [META]: ReactiveEntity
}

export const READONLY_ION = Symbol('readonlySignal');

export function asReadonly<R extends AtomicIon<T> | IonicModel, T>(reactiveRef: R): R extends AtomicIon ? ReadonlyIon<T> : R {
    if (isIon(reactiveRef)) {
        const readonlySignal = () => reactiveRef()
        readonlySignal[META] = reactiveRef[META]
        readonlySignal[READONLY_ION] = true;
        return readonlySignal as R extends AtomicIon ? ReadonlyIon<T> : R
    }
    if (isIonicModel(reactiveRef)) {
        //TODO: 
        return reactiveRef as R extends AtomicIon ? ReadonlyIon<T> : R;
    }
    return reactiveRef;
}


//TODO:

const proxy = new Proxy({
    name: 'sirRobin',
    setName(name){
        proxy.name = name
    }
}, {
    get(target, key, receiver){
        console.log('==============================')
        console.log("getting", target, key)
        if (receiver !== proxy)
         console.log('readonlyFlag', receiver.readonlyFlag ) // this causes infinit loop in proxy, but works for readonly
        else console.log('readonlyFlag', Reflect.get(target, 'readonlyFlag', receiver)) // this returns undefined in readonly, but works for proxy
        return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver){
               console.log("setting", target, key, value)
        console.log('readonlyFlag', receiver.readonlyFlag)
        target[key] = value
        return true;
    }
})

// console.log("proto", Object.getPrototypeOf(proxy))

const readonly = Object.create(proxy)
Object.defineProperty(readonly, 'readonlyFlag', {value: true})

// console.log('readonly', readonly)
console.log('readonly name', readonly.name)
console.log('proxy name', proxy.name)

for (const key in readonly){
    console.log('loop',key)
}
import { READONLY } from "../ion/ProtectedIon";
import { IonicModel } from "./IonicModel";


export const PROTECTED = Symbol('protectedIonicModel')

export function isProtectedIonicModel(value: any) {
    if (!(value instanceof Object)) return false;
    return PROTECTED in value;
}

export function protectIonicModel<T extends IonicModel>(model: T, methodKeys?: string[] | typeof READONLY) {
    return model
}



//TODO:

const proxy = new Proxy({
    name: 'sirRobin',
    setName(name) {
        proxy.name = name
    }
}, {
    get(target, key, receiver) {
        console.log('==============================')
        console.log("getting", target, key)
        if (receiver !== proxy)
            console.log('readonlyFlag', receiver.readonlyFlag) // this causes infinit loop in proxy, but works for readonly
        else console.log('readonlyFlag', Reflect.get(target, 'readonlyFlag', receiver)) // this returns undefined in readonly, but works for proxy
        return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
        console.log("setting", target, key, value)
        console.log('readonlyFlag', receiver.readonlyFlag)
        target[key] = value
        return true;
    }
})

// console.log("proto", Object.getPrototypeOf(proxy))

const readonly = Object.create(proxy)
Object.defineProperty(readonly, 'readonlyFlag', { value: true })

// console.log('readonly', readonly)
console.log('readonly name', readonly.name)
console.log('proxy name', proxy.name)

for (const key in readonly) {
    console.log('loop', key)
}
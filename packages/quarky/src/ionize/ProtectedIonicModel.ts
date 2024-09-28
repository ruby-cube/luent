import { AnyObject } from "@rue/types";
import { READONLY } from "../ion/ProtectedIon";
import { asMetaIonicModel, IonicModel } from "./IonicModel";
import { mO } from "@rue/lumo";


export const PROTECTED = Symbol('protectedIonicModel')

export function isProtectedIonicModel(value: any) {
    if (!(value instanceof Object)) return false;
    return PROTECTED in value;
}

export function protectIonicModel<T extends IonicModel>(model: T, propertyKeys?: { [key: string]: true } | typeof READONLY) {
    if (propertyKeys === READONLY) {
        const existing = asMetaIonicModel(model).asReadonly
        if (existing) return existing;
        return createReadonlyIonicModel(model)
    }
    // custom encaspulation
    if (propertyKeys)
        return createProtectedIonicModel(model, propertyKeys)

    // encapsulation
    const existing = asMetaIonicModel(model).asProtected
    if (existing) return existing;
    return createProtectedIonicModel(model)
}

const READONLY_IONIC_MODEL = Symbol('readonlyIonicModel')
const PROTECTED_IONIC_MODEL = Symbol('protectedIonicModel')



function createProtectedIonicModel(model: IonicModel, propertyKeys?: { [key: string]: true }) {
    const protectedModel = Object.create(model);
    protectedModel[PROTECTED_IONIC_MODEL] = propertyKeys || true;
    return protectedModel
}


function createReadonlyIonicModel(model: IonicModel) {
    const readonlyModel = Object.create(model);
    readonlyModel[READONLY_IONIC_MODEL] = true;
    return readonlyModel
}



// const proxy = new Proxy({
//     name: 'sirRobin',
//     setName(name) {
//         proxy.name = name
//     }
// }, {
//     get(target, key, receiver) {
//         console.log('==============================')
//         console.log("getting", target, key)
//         if (receiver !== proxy)
//             console.log('readonlyFlag', receiver.readonlyFlag) // this causes infinit loop in proxy, but works for readonly
//         else console.log('readonlyFlag', Reflect.get(target, 'readonlyFlag', receiver)) // this returns undefined in readonly, but works for proxy
//         return Reflect.get(target, key, receiver)
//     },
//     set(target, key, value, receiver) {
//         console.log("setting", target, key, value)
//         console.log('readonlyFlag', receiver.readonlyFlag)
//         target[key] = value
//         return true;
//     }
// })

export function isProtectedProxy(target: AnyObject, proxy: AnyObject, receiver: AnyObject) {
    if (receiver !== proxy)
        return receiver[READONLY_IONIC_MODEL] || receiver[PROTECTED_IONIC_MODEL];
    return Reflect.get(target, READONLY_IONIC_MODEL, receiver) || Reflect.get(target, PROTECTED_IONIC_MODEL, receiver)
}

export function isReadonlyProxy(target: AnyObject, proxy: AnyObject, receiver: AnyObject) {
    if (receiver !== proxy)
        return receiver[READONLY_IONIC_MODEL]
    return Reflect.get(target, READONLY_IONIC_MODEL, receiver)
}

export function getProtectedModelValue(target: AnyObject, proxy: AnyObject, receiver: AnyObject): true | {[key: string]: true} | undefined {
    if (receiver !== proxy)
        return receiver[PROTECTED_IONIC_MODEL];
    return Reflect.get(target, PROTECTED_IONIC_MODEL, receiver)
}

// export function getCustomProtectedModelKeys(target: AnyObject, proxy: AnyObject, receiver: AnyObject){
//     if (receiver !== proxy)
//         return receiver[PROTECTED_IONIC_MODEL];
//     return Reflect.get(target, PROTECTED_IONIC_MODEL, receiver)
// }

// console.log("proto", Object.getPrototypeOf(proxy))


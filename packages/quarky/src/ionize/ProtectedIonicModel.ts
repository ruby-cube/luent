import { AnyObject } from "@rue/types";
import { READONLY } from "../ion/ProtectedIon";
import { asMetaIonicModel, IonizedModel } from "./ionize";


// export const PROTECTED = Symbol('protectedIonicModel')

export function isProtectedIonicModel(value: any) {
    if (!(value instanceof Object)) return false;
    return PROTECTED_META in value || READONLY_IONIC_MODEL in value;
}

export function isReadonlyIonicModel(value: any) {
    if (!(value instanceof Object)) return false;
    return READONLY_IONIC_MODEL in value;
}

export function protectIonicModel<T extends IonizedModel>(model: T, propertyKeys: (PropertyKey| typeof READONLY)[]) {
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
// const PROPERTY_KEYS = Symbol('protectedIonicModel')

export const PROTECTED_META = Symbol('protectedMeta')

function createProtectedIonicModel(model: IonizedModel, propertyKeys?: { [key: string]: true }) {
    const protectedModel = Object.create(model);
    // protectedModel[PROTECTED_META] = {
        //     propertyKeys
        // }
        Object.defineProperty(protectedModel, PROTECTED_META, {value: {
            propertyKeys
        }})
 
    return protectedModel
}


function createReadonlyIonicModel(model: IonizedModel) {
    const readonlyModel = Object.create(model);
    // readonlyModel[READONLY_IONIC_MODEL] = true;
    Object.defineProperty(readonlyModel, READONLY_IONIC_MODEL, {value: true})
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
        return !!receiver[READONLY_IONIC_MODEL] || !!receiver[PROTECTED_META];
    // return Reflect.get(target, READONLY_IONIC_MODEL, receiver) || Reflect.get(target, PROTECTED_META, receiver)
    return false;
}

export function isReadonlyProxy(target: AnyObject, proxy: AnyObject, receiver: AnyObject) {
    if (receiver !== proxy)
        return !!receiver[READONLY_IONIC_MODEL]
    return false;
}

export function getProtectedModelMeta(target: AnyObject, proxy: AnyObject, receiver: AnyObject): {propertyKeys: {[key: string]: true} | undefined} | undefined {
    if (receiver !== proxy){
        // console.log('receiver', receiver)
        // console.log('proxy', proxy)
        // return Reflect.get(target, PROTECTED_META, receiver)
        return receiver[PROTECTED_META];
    }
    return undefined;
}

// export function getCustomProtectedModelKeys(target: AnyObject, proxy: AnyObject, receiver: AnyObject){
//     if (receiver !== proxy)
//         return receiver[PROTECTED_IONIC_MODEL];
//     return Reflect.get(target, PROTECTED_IONIC_MODEL, receiver)
// }

// console.log("proto", Object.getPrototypeOf(proxy))


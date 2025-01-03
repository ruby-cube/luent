import { AnyObject } from "@rue/types";
import { asMetaIonizedModel, IonizedModel, toRaw } from "./ionize";
import { isReadonlyIonizedModel, READONLY_IONIC_MODEL } from "./ReadonlyIonizedModel";
import { isReadonly } from "../readonly";
import { isMethod } from "./IonizedModel";


export const REINED_META = Symbol('reinedMeta')

export function isReinedIonizedModel(value: any) {
   if (!(value instanceof Object)) return false;
   return REINED_META in value
}

export function reinIonizedModel<T extends IonizedModel>(model: T, exposedKeys: PropertyKey[]) {
   if (exposedKeys.length)
      return createCustomReinedIonizedModel(model, exposedKeys)
   if (isReadonlyIonizedModel(model))
      return model;
   return asReinedIonizedModel(model)
}

export function asReinedIonizedModel(model: IonizedModel) {
   const existing = asMetaIonizedModel(model).asDefaultReined
   if (existing) return existing;
   return createReinedIonizedModel(model)
}


function createCustomReinedIonizedModel(model: IonizedModel, exposedKeys: PropertyKey[]) {
   const proto = isReinedIonizedModel(model) || isReadonlyIonizedModel(model) ? asMetaIonizedModel(model).ionicModel! : model;
   const reinedModel = Object.create(proto);
   const _exposedKeys = composeExposedKeys(exposedKeys, model)
   if (!_exposedKeys) return model;

   Object.defineProperty(reinedModel, REINED_META, {
      value: {
         isExposedKey(key: PropertyKey) {
            return _exposedKeys.has(key)
         }
      }
   })

   return reinedModel
}

export function composeExposedKeys(exposedKeys: PropertyKey[], model: AnyObject) {
   const rawModel = toRaw(model);
   const _exposedKeys = new Set(exposedKeys)
   let noProps = true;
   for (const key of exposedKeys) {
      if (isMethod(rawModel[key]))
         continue;
      noProps = false;
      break;
   }
   if (noProps) {
      if (isReadonly(model))
         return undefined;
      if (REINED_META in model) {
         const reinedMeta = model[REINED_META];
         for (const key in rawModel) {
            if (isMethod(rawModel[key]))
               continue;
            if (reinedMeta.isExposedKey(key)) {
               _exposedKeys.add(key)
            }
         }
      }
      else {
         for (const key in rawModel) {
            if (isMethod(rawModel[key]))
               continue;
            _exposedKeys.add(key)
         }
      }
   }
   return _exposedKeys;
}

function createReinedIonizedModel(model: IonizedModel) {
   const meta = asMetaIonizedModel(model)
   const reinedModel = Object.create(model);
   Object.defineProperty(reinedModel, REINED_META, {
      value: {
         isExposedKey(key: PropertyKey) {
            if (typeof key === 'string' && key[0] === '_')
               return false;
            return key in model;
         }
      }
   })
   meta.asDefaultReined = reinedModel
   return reinedModel
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

export function isRestricted(target: AnyObject, proxy: AnyObject, receiver: AnyObject) {
   if (receiver !== proxy)
      return !!receiver[READONLY_IONIC_MODEL] || !!receiver[REINED_META];
   // return Reflect.get(target, READONLY_IONIC_MODEL, receiver) || Reflect.get(target, REINED_META, receiver)
   return false;
}

export function isReadonlyProxy(target: AnyObject, proxy: AnyObject, receiver: AnyObject) {
   if (receiver !== proxy)
      return !!receiver[READONLY_IONIC_MODEL]
   return false;
}

export function getReinedMeta(target: AnyObject, proxy: AnyObject, receiver: AnyObject): { isExposedKey: (key: PropertyKey) => boolean } | undefined {
   if (receiver !== proxy) {
      // console.log('receiver', receiver)
      // console.log('proxy', proxy)
      // return Reflect.get(target, REINED_META, receiver)
      return receiver[REINED_META];
   }
   return undefined;
}

// export function getCustomProtectedModelKeys(target: AnyObject, proxy: AnyObject, receiver: AnyObject){
//     if (receiver !== proxy)
//         return receiver[PROTECTED_IONIC_MODEL];
//     return Reflect.get(target, PROTECTED_IONIC_MODEL, receiver)
// }

// console.log("proto", Object.getPrototypeOf(proxy))


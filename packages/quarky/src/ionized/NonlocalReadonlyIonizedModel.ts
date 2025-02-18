import { AnyObject } from "@rue/types";
import { Ionized } from "./ionize";
import { __DEV__proxyGetterAssertions, createProxySwitchMap, CustomIonizedModelConfig, getNativeMethodConfig, getTargetKey, initialPropertyAccess, IonizedModel, isMethod, isNativeMethod, ProxySwitchMap } from "./IonizedModel";
import { asNonlocalReadonly, isLocalKey, restrictAccess } from "../capsule/Readonly";
import { quarkOf } from "../Quark";



// non-local: underscored properties are omitted
// properties are readonly


export function createNonlocalReadonlyIonizedModel(originalIonizedModel: IonizedModel) {
   const quark = quarkOf(<Ionized<Object>>originalIonizedModel)
   const { rawTarget, methods, structureConfigs } = quark

   const switchMap = createProxySwitchMap(quark)

   const readonlyModel = new Proxy(rawTarget, {
      has(target, key) { //TODO: should methods not be in readonly object?
         const getValue = switchMap.get(key)
         if (getValue)
            return true;
         return key in target || !!methods && key in methods
      },
      get(target, key, receiver) {
         __DEV__proxyGetterAssertions(readonlyModel, receiver)
         const getValue = switchMap.get(key)
         if (getValue) return getValue();
         return initialAccess(
            target,
            methods,
            readonlyModel,
            structureConfigs,
            key,
            switchMap
         )
      },
      set() {
         if (__DEV__) console.error('Set operation failed. Object is readonly.')
         return false;
      }
   }) as IonizedModel

   quark.asReadonly = readonlyModel
   return readonlyModel
}


function initialAccess(
   target: AnyObject,
   methods: AnyObject | undefined,
   ionizedModel: IonizedModel,
   structureConfigs: CustomIonizedModelConfig[],
   key: string | symbol,
   switchMap: ProxySwitchMap
) {
   if (isLocalKey(key) || methods && key in methods) {
      return restrictAccess(key, switchMap)
   }
   const _key = methods ? getTargetKey(methods, key) : key;
   const nativeMethodConfig = getNativeMethodConfig(_key, structureConfigs)
   if (nativeMethodConfig) { //NOTE: this block must be before target[_key] for Array.from(set) to work
      return restrictAccess(key, switchMap)
   }
   const value = target[_key]
   if (isMethod(value)) {
      return restrictAccess(key, switchMap)
   }
   return initialPropertyAccess( //TODO: figure out a better way to implement deep readonly
      target,
      ionizedModel,
      structureConfigs,
      key,
      value,
      switchMap,
      value => asNonlocalReadonly(value)
   )
}



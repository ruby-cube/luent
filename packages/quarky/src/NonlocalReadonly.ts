import { AnyObject } from "@rue/types";
import { createNonlocalReadonlyIonizedModel } from "./ionize/NonlocalReadonlyIonizedModel";
import { isIonizedModel } from "./ionize/ionize";
import { createReadonlyIon, isWritableIon } from "./ion/ReadonlyIon";
import { __DEV__proxyGetterAssertions, createProxySwitchMap, isMethod, ProxySwitchMap } from "./ionize/IonizedModel";
import { isObject } from "@rue/utils";
import { META } from "./ReactiveEntity";
import { Traceable } from "./debug";

export function asNonlocalReadonly(value: any) {
   if (!isObject(value)) return value;
   if (META in value) {
      const meta = value[META] as { asReadonly?: AnyObject }
      const readonly = meta.asReadonly
      if (readonly) return readonly;
   }
   if (isWritableIon(value)) {
      return createReadonlyIon(value)
   }
   if (isIonizedModel(value)) {
      return createNonlocalReadonlyIonizedModel(value)
   }
   if (isObject(value)) {
      return createReadonlyObject(value)
   }
   //QUESTION: Should we have readonly functions that return deep readonly?
   return value;
}

export function isReadonly(value: any) {
   if (!isObject(value)) return false;
   const meta =
      //@ts-expect-error
      value[META]
   if (meta && meta.asReadonly === value) return true;
   return false;
}


export function createReadonlyObject(obj: AnyObject) { //TODO: what about Arrays, Maps, and Sets for deep readonly
   const meta = new MetaReadonlyObject(obj)
   const switchMap = createProxySwitchMap(meta)
   const proxy = new Proxy(obj, {
      get(target, key, receiver) {
         __DEV__proxyGetterAssertions(proxy, receiver)
         const getValue = switchMap.get(key)
         if (getValue) return getValue();
         return initialAccess(
            target,
            proxy,
            key,
            switchMap
         )
      },
      set() {
         console.warn('Set operation failed. Object is readonly.')
         return false;
      }
   })
}

class MetaReadonlyObject {
   asReadonly?: AnyObject
   asReined?: AnyObject
   __DEV__asTraceable?: Traceable
   constructor(
      public rawTarget: AnyObject
   ) {
      if (__DEV__) this.__DEV__asTraceable = new Traceable()
   }
}


function initialAccess(
   target: AnyObject,
   proxy: AnyObject,
   key: string | symbol,
   switchMap: ProxySwitchMap
) {
   if (isLocalKey(key)) {
      return restrictAccess(key, switchMap)
   }
   const value = target[key]
   if (isMethod(value)) {
      return restrictAccess(key, switchMap)
   }
   return initialPropertyAccess(
      target,
      key,
      value,
      switchMap
   )
}

function initialPropertyAccess(
   target: AnyObject,
   key: string | symbol,
   value: any,
   switchMap: ProxySwitchMap
) {
   switchMap.set(key, () => asNonlocalReadonly(target[key]))
   return asNonlocalReadonly(value)
}

export function isLocalKey(key: string | symbol) {
   return (typeof key === 'string' && /^_[a-zA-Z]/.test(key))
}


export function restrictAccess(key: string | symbol, switchMap: ProxySwitchMap) {
   switchMap.set(key, getRestrictedProperty)
   return getRestrictedProperty()
}
function getRestrictedProperty() {
   if (__DEV__) throw new Error('Object is read-only and non-local. Cannot access methods or local properties')
   return undefined;
}


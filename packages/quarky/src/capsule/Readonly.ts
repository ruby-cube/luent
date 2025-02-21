import { AnyObject } from "@rue/types";
import { createNonlocalReadonlyIonizedModel } from "../ionized/NonlocalReadonlyIonizedModel";
import { isIonizedModel } from "../ionized/ionize";
import { createReadonlyIon, isWritableIon } from "../ion/ReadonlyIon";
import { __DEV__proxyGetterAssertions, createProxySwitchMap, isMethod, ProxySwitchMap } from "../ionized/IonizedModel";
import { isFunction, isObject } from "@rue/utils";
import { quarkOf, hasQuark } from "../Quark";
import { Traceable } from "../debug/Traceable";

export function asNonlocalReadonly(value: any) {
   if (!(value instanceof Object)) return value;
   if (hasQuark(value) || readonlyQuarkMap.has(value)) {
      const meta = quarkOf(value) ?? readonlyQuarkMap.get(value) as { asReadonly?: AnyObject }
      const readonly = meta.asReadonly
      if (readonly) return readonly;
   }
   if (isWritableIon(value)) {
      return createReadonlyIon(value)
   }
   if (isIonizedModel(value)) {
      return createNonlocalReadonlyIonizedModel(value)
   }
   if (!isFunction(value) && value instanceof Object) {
      return createReadonlyObject(value)
   }
   return value;
}

//TODO: Should we have readonly functions that return deep readonly? Or leave it up to dev to call asNonlocalReadonly?
export function returnsReadonly() {

}

export function isReadonly(value: any) {
   if (!(value instanceof Object)) return false;
   const quark = quarkOf(value) || readonlyQuarkMap.get(value)
   if (quark && quark.asReadonly === value) return true;
   return false;
}

const readonlyQuarkMap = new Map()

export function createReadonlyObject(obj: AnyObject) { //TODO: what about Arrays, Maps, and Sets for deep readonly
   const meta = readonlyQuarkMap.get(obj) ?? new MetaReadonlyObject(obj)
   const switchMap = createProxySwitchMap(meta)
   const proxy = new Proxy(obj, {
      has(target, key) { //TODO: should methods not be in readonly object?
         const getValue = switchMap.get(key)
         if (getValue)
            return true;
         return key in target
      },
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
         if (__DEV__) console.error('Set operation failed. Object is readonly.')
         return false;
      }
   })
   readonlyQuarkMap.set(obj, meta)
   meta.asReadonly = proxy;
   return proxy;
}

class MetaReadonlyObject {
   asReadonly?: AnyObject
   asReined?: AnyObject
   asTraceable?: Traceable
   constructor(
      public rawTarget: AnyObject
   ) {
      if (__DEV__) this.asTraceable = new Traceable()
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
      switchMap,
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
   if (__DEV__) console.error('Object is read-only and non-local. Cannot access methods or local properties')
   return undefined;
}


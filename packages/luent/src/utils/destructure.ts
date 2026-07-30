import { ªªof } from "@luent/nextscript";

type $From<T> = T & AccessorsOf<T>

type AccessorsOf<T> = {
  [K in keyof T as K extends string ? `$${K}` : never]: ToAccessor<T[K]>
}

// TODO: handle unions of getters and non-getters
type ToAccessor<T> = T extends () => any ? T : () => T

function isGetterKey(key: PropertyKey): key is `$${string}` {
  if (typeof key !== 'string') return false;
  return key.startsWith('$')
}

export function $from<T extends object>(target: T): $From<T> {
  if (typeof target !== 'object') throw new TypeError('target must be destructurable')
  return (new Proxy(target, {
    get(target, key, receiver) {
      if (isGetterKey(key)) {
        const valueKey = key.slice(1) as keyof T
        if (valueKey in target && target[valueKey] !== undefined) {
          return ªªof(target)[valueKey]
        }
        return undefined
      }
      return Reflect.get(target, key, receiver)
    },
    set() {
      return false;
    }
  })) as $From<T>
}


type DestructuredAccessors<T, TMap> = {
  [K in keyof T]: K extends keyof TMap ? TMap[K] extends 1 ? AccessorValue<T, K> : TMap[K] extends object ? DestructuredAccessors<T[K], TMap[K]> : T[K] : T[K]
}

// /**
//  * const { a, b, c: { d } } = destructureToAccessors(obj, { a: 1, b: 0, c: { d: 1 } })
//  * @param obj 
//  * @param map 
//  * @returns 
//  */
// function destructureToAccessors<T extends AnyObject, TMap extends AnyObject>(obj: T, map: TMap): DestructuredAccessors<T, TMap> {
//    const destructured = Array.isArray(obj) ? [] : Object.create(null)
//    const keys = Object.keys(map)
//    for (const key of keys) {
//       const value = map[key]
//       if (value === 0) {
//          destructured[key] = obj[key]
//       }
//       else if (value === 1) {
//          destructured[key] = accessorsOf(obj)[key] // assumes never undefined
//       }
//       else if (isObject(value)) {
//          destructured[key] = destructureToAccessors(obj[key], map[key])
//       }
//    }
//    return destructured
// }
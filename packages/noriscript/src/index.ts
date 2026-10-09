import { AnyObject, ReadonlyKeys } from "@luently/types";
import { isObject } from "@luently/utils";
export * from './component'

//  - [ ] destructureªª
//  - [ ] X absorbª, absorbsª
//  - [X] assertª
//  - [X] assertµ
//  - [X] toª
//  - [X] ªªof

/**
 * Asserts value is an accessor function, evaluated by `typeof value !== 'function' || value.length !== 0`
 * @param value 
 * @returns value | never
 */
export function assertAccessor<T extends () => any>(value: T): T {
  if (!isAccessor(value)) {
    throw new TypeError(`Accessor must be a function with zero parameters: ${value}`)
  }
  return value;
}

export function isAccessor<T>(value: T): value is T & (() => ValueOf<T>) {
  return typeof value === 'function' && value.length === 0
}

export interface Get<T> {
  (): T;
}

interface MutableGet<T = unknown> extends Get<T> {
  value: T
}

type ValueOf<T> = T extends () => infer V ? V : never

/**
 * Asserts value implements the MutableGet interface--an accessor with a 'value' property.
 * 
 * @example 
 * assertµ(count).value = 0
 * 
 * @param value 
 * @returns void
 */
export function assertMutableAccessor<T extends MutableGet>(value: T): T {
  if (!isAccessor(value) || !('value' in value)) {
    throw new TypeError('Assignment to readonly accessor variable')
  }
  return value
}

type Postfix = '?' | '!'


type AsAccessor<T, P extends Postfix | undefined> =
  T extends Get<any>
  ? T
  : P extends '?'
  ? (() => NonNullable<T>) | (Extract<T, null | undefined> extends never ? never : undefined)
  : P extends '!'
  ? () => NonNullable<T>
  : () => T

/**
 * Normalizes value to an accessor: if value is an accessor, returns the value, otherwise wraps the value in an accessor.
 * 
 * @example
 * toª(count)
 * 
 * @param value
 * @param postfix (optional)
 * @returns value | (() => value) | undefined
 */
function toAccessor<T, P extends Postfix | undefined = undefined>(value: T, postfix?: P): AsAccessor<T, P> {
  if (isAccessor(value)) return value as AsAccessor<T, P>
  if (postfix === '?' && value == null) {
    return undefined as AsAccessor<T, P>
  }
  if (postfix === '!' && value == null) {
    throw new TypeError('Value must be non-nullish')
  }
  return (() => value) as AsAccessor<T, P>
}



// type Foo = {
//    getGount: () => number, // () => number
//    readonly bar: number, // Get<number>
//    frog: string // MutableGet<string>
//    option?: string // MutableGet<string | undefined> | undefined
// }

// FIX: consider the case: (() => T) | undefined (or any other type)
type AccessorValue<T, K extends keyof T> =
  T[K] extends Get<any>
  ? T[K]
  : K extends ReadonlyKeys<T>
  ? Get<T[K]>
  : MutableGet<T[K]>

type AccessorsOf<T extends object> = {
  readonly [K in keyof T]: AccessorValue<T, K>
}

const accessorsProxyCache = new WeakMap<object, object>();

const POSTFIX = Symbol('postfix')


function accessorsOf<T extends object>(target: undefined | null, postfix?: '?' | '!'): undefined
function accessorsOf<T extends object>(target: T, postfix?: '?' | '!'): AccessorsOf<T>
function accessorsOf<T extends object>(target: T | undefined | null, postfix?: '?' | '!'): AccessorsOf<T> | undefined {
  if (target == undefined) return undefined;
  let proxy: AccessorsOf<T> | undefined = accessorsProxyCache.get(target) as AccessorsOf<T> | undefined
  if (proxy) {
    (proxy as AccessorsOf<T> & { [POSTFIX]: Postfix | undefined })[POSTFIX] = postfix
    return proxy
  }
  proxy = createAccessorsProxy(target, postfix)
  accessorsProxyCache.set(target, proxy)
  return proxy
}

function createAccessorsProxy<T extends object>(target: T, postfix: Postfix | undefined): AccessorsOf<T> {
  const accessors = new Map<PropertyKey, Get<any>>()

  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      if (value == null) {
        if (postfix === '?') return value;
        if (postfix === '!') throw new TypeError('Value must be non-null')
      }
      if (isAccessor(value)) return value;
      return accessors.get(key) ?? createAccessor(target, key, receiver)
    },
    set(_, key, value) {
      if (key === POSTFIX) {
        postfix = value;
        return true;
      }
      return false
    }
  }) as AccessorsOf<T>

  function createAccessor(target: object, key: PropertyKey, receiver: object) {
    const accessor = () => Reflect.get(target, key, receiver)
    accessors.set(key, accessor)

    Object.defineProperty(accessor, "value", {
      get: accessor,
      set(value) {
        const success = Reflect.set(target, key, value, receiver);
        if (!success) {
          throw new TypeError(`Cannot set property ${String(key)} via accessor`);
        }
      },
      enumerable: false,
      configurable: false,
    });

    return accessor;
  }
}

type DestructuredAccessors<T, TMap> = {
  [K in keyof T]: K extends keyof TMap ? TMap[K] extends 1 ? AccessorValue<T, K> : TMap[K] extends object ? DestructuredAccessors<T[K], TMap[K]> : T[K] : T[K]
}

/**
 * const { a, b, c: { d } } = destructureToAccessors(obj, { a: 1, b: 0, c: { d: 1 } })
 * @param obj 
 * @param map 
 * @returns 
 */
function destructureToAccessors<T extends AnyObject, TMap extends AnyObject>(obj: T, map: TMap): DestructuredAccessors<T, TMap> {
  const destructured = Array.isArray(obj) ? [] : Object.create(null)
  const keys = Object.keys(map)
  for (const key of keys) {
    const value = map[key]
    if (value === 0) {
      destructured[key] = obj[key]
    }
    else if (value === 1) {
      destructured[key] = accessorsOf(obj)[key] // assumes never undefined
    }
    else if (isObject(value)) {
      destructured[key] = destructureToAccessors(obj[key], map[key])
    }
  }
  return destructured
}


export const destructureªª = destructureToAccessors
export const assertª = assertAccessor
export const assertµ = assertMutableAccessor
export const toª = toAccessor
export const ªªof = accessorsOf




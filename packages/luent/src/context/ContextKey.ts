import { isFunction } from "@luently/utils";

export function MU_<K extends ContextEntryKey | string>(key: K): ContextEntryKey<K extends ContextEntryKey<infer T> ? T : unknown> {
  const contextKey = toContextKey(key)
  const name = 'MU_' + contextKey;
  const fnKey = function (value: unknown) {
    return [name, value]
  };
  Object.defineProperty(fnKey, "name", { value: name });
  Object.defineProperty(fnKey, "contextKey", { value: contextKey });
  return fnKey as ContextEntryKey<K extends ContextEntryKey<infer T> ? T : unknown>
}

export type ContextEntryKey<T = any> = ((value: T) => [ContextEntryKey<T>, T]) & { defaultValue: any, optional: boolean }

type FnKey = ContextEntryKey & { contextKey: string | ContextEntryKey }

export function mergeKeys(...keys: ContextEntryKey[]) {
  const mergedKey = ContextKey()
  for (const fnKey of keys) {
    (fnKey as FnKey).contextKey = mergedKey
  }
  return mergedKey
}

export function isMuKey(key: unknown) {
  return isFunction(key) && key.name.startsWith('MU_')
}

export function toContextKey(key: ContextEntryKey | string): string | Function {
  if (typeof key === 'string') return key;
  if ('contextKey' in key)
    return key.contextKey as string
  return key.name === 'context-key' ? key : key.name
}

export function ContextKey<T>(optional?: '?' | (() => T)): ContextEntryKey<T> {
  const defaultValue = typeof optional === 'function' ? optional : undefined;
  const fnKey = function (v: T) {
    return { 0: fnKey, 1: v }
  }
  Object.defineProperty(fnKey, 'name', { value: 'context-key' })
  Object.defineProperty(fnKey, 'optional', { value: !!optional })
  if (defaultValue) Object.defineProperty(fnKey, 'defaultValue', { value: defaultValue })
  return fnKey as ContextEntryKey<T>
}

// export function isOpKey(key: string) {
//    return key.startsWith('CAN_')
// }

// export function isEventKey(key: string) {
//    return key.startsWith('ON_')
// }


// TODO: should we validate at provide() or validate at fromContext()?
// - required/optional/ toDefault
// - readonly reined
// - normalize reactivity

// [ ] Runtime validation and normalization of reactive type. Defaults
//     - fromTag()
//     - fromContext()
// 
// [ ] Read-only and Reined conversion
//     - fromTag()
//     - fromContext()
//     - ref()

// const [HELLO, MU_HELLO] = ContextKey(v<{ dog: string }>, 'm?')
// const [HELLOA, MU_HELLOA] = ContextKey(v<{ dog: string }>, 'mu?')
// const HELLOV = ContextKey(v<{ dog: string }>, 'm')
// const HELLOC = ContextKey(v<{ dog: string }>, 'mu')
// const HELLOD = ContextKey(v<{ dog: string }>)

// const [OHELLO, OMU_HELLO] = ContextKey(v<{ dog: string }>('?'), 'm?')
// const [OHELLOA, OMU_HELLOA] = ContextKey(v<{ dog: string }>('?'), 'mu?')
// const OHELLOV = ContextKey(v<{ dog: string }>('?'), 'm')
// const OHELLOC = ContextKey(v<{ dog: string }>('?'), 'mu')
// const OHELLOD = ContextKey(v<{ dog: string }>('?'))

// const OHELLOD = ContextKey(v<{ dog: string }>, 'm')
// const OHELLOD = ContextKey(v<{ dog: string }>, 'm?')
// const OHELLOD = ContextKey(v<{ dog: string }>, 'mu')
// const OHELLOD = ContextKey(v<{ dog: string }>, 'mu?')



// const DOHELLOD = ContextKey(
//    v('?')({ dog: 'hi' })
// )

// const DOHELLODWORLD = ContextKey(v<string>('?')('hi'))



// OHELLOD({ dog: '' })
// HELLOD({ dog: '' })
// DOHELLOD({ dog: 'sk' })




// type ImmutableInput<S> = S extends { key: infer K } ? K extends string ?
//    K extends RequiredInputKey<K, S> ? Input<S>
//    : K extends OptionalInputKey<K, S> ? Input<S> | undefined
//    : never : never : never

// provide
// function $U<S extends symbol & ContextTypeConfig>(key: ExcludeMutableKey<S>) {
//    return (input: ImmutableInput<S>) => {
//       return [key, input]
//    }
// }

// function $M<S extends symbol & ContextTypeConfig>(key: ExcludeMutableKey<S>) {
//    return (input: ImmutableInput<S> & ((...args: any[]) => any)) => {
//       return [key, input]
//    }
// }

// $U(HELLO)({ dog: 'skd' })

// function $MU<S extends symbol & ContextTypeConfig>(key: S, input: S['required'] extends true ? S['key'] extends string ? Input<S> : never : never) {

// }














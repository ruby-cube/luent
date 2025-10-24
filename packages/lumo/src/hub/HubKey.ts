import { isFunction } from "@rue/utils";

export function MU_<K extends CommonsEntryKey | string>(key: K): CommonsEntryKey<K extends CommonsEntryKey<infer T> ? T : unknown> {
   const commonsKey = toCommonsKey(key)
   const name = 'MU_' + commonsKey;
   const fnKey = function (value: unknown) {
      return [name, value]
   };
   Object.defineProperty(fnKey, "name", { value: name });
   Object.defineProperty(fnKey, "commonsKey", { value: commonsKey });
   return fnKey as CommonsEntryKey<K extends CommonsEntryKey<infer T> ? T : unknown>
}

export type CommonsEntryKey<T = any> = (value: T) => [CommonsEntryKey<T>, T]

type FnKey = CommonsEntryKey & { commonsKey: string }

export function mapCommonsKeys(map: { [key: string]: CommonsEntryKey[] }) {
   for (const key in map) {
      const fnKeys = map[key];
      for (const fnKey of fnKeys) {
         (fnKey as FnKey).commonsKey = key
      }
   }
}

export function isMuKey(key: unknown) {
   return isFunction(key) && key.name.startsWith('MU_')
}

export function toCommonsKey(key: CommonsEntryKey | string): string {
   if (typeof key === 'string') return key;
   if ('commonsKey' in key)
      return key.commonsKey as string
   return key.name
}

export function HubKey<T>(key: string = 'commons-key'): CommonsEntryKey<T> {
   const fnKey = function (v: T) {
      return [fnKey, v]
   }
   Object.defineProperty(fnKey, 'name', { value: key })
   return fnKey as CommonsEntryKey<T>
}

// export function isOpKey(key: string) {
//    return key.startsWith('CAN_')
// }

// export function isEventKey(key: string) {
//    return key.startsWith('ON_')
// }


// TODO: should we validate at provide() or validate at fromHub()?
// - required/optional/ toDefault
// - readonly reined
// - normalize reactivity

// [ ] Runtime validation and normalization of reactive type. Defaults
//     - fromTag()
//     - fromHub()
// 
// [ ] Read-only and Reined conversion
//     - fromTag()
//     - fromHub()
//     - ref()

// const [HELLO, MU_HELLO] = HubKey(v<{ dog: string }>, 'm?')
// const [HELLOA, MU_HELLOA] = HubKey(v<{ dog: string }>, 'mu?')
// const HELLOV = HubKey(v<{ dog: string }>, 'm')
// const HELLOC = HubKey(v<{ dog: string }>, 'mu')
// const HELLOD = HubKey(v<{ dog: string }>)

// const [OHELLO, OMU_HELLO] = HubKey(v<{ dog: string }>('?'), 'm?')
// const [OHELLOA, OMU_HELLOA] = HubKey(v<{ dog: string }>('?'), 'mu?')
// const OHELLOV = HubKey(v<{ dog: string }>('?'), 'm')
// const OHELLOC = HubKey(v<{ dog: string }>('?'), 'mu')
// const OHELLOD = HubKey(v<{ dog: string }>('?'))

// const OHELLOD = HubKey(v<{ dog: string }>, 'm')
// const OHELLOD = HubKey(v<{ dog: string }>, 'm?')
// const OHELLOD = HubKey(v<{ dog: string }>, 'mu')
// const OHELLOD = HubKey(v<{ dog: string }>, 'mu?')



// const DOHELLOD = HubKey(
//    v('?')({ dog: 'hi' })
// )

// const DOHELLODWORLD = HubKey(v<string>('?')('hi'))



// OHELLOD({ dog: '' })
// HELLOD({ dog: '' })
// DOHELLOD({ dog: 'sk' })




// type ImmutableInput<S> = S extends { key: infer K } ? K extends string ?
//    K extends RequiredInputKey<K, S> ? Input<S>
//    : K extends OptionalInputKey<K, S> ? Input<S> | undefined
//    : never : never : never

// provide
// function $U<S extends symbol & CommonsTypeConfig>(key: ExcludeMutableKey<S>) {
//    return (input: ImmutableInput<S>) => {
//       return [key, input]
//    }
// }

// function $M<S extends symbol & CommonsTypeConfig>(key: ExcludeMutableKey<S>) {
//    return (input: ImmutableInput<S> & ((...args: any[]) => any)) => {
//       return [key, input]
//    }
// }

// $U(HELLO)({ dog: 'skd' })

// function $MU<S extends symbol & CommonsTypeConfig>(key: S, input: S['required'] extends true ? S['key'] extends string ? Input<S> : never : never) {

// }














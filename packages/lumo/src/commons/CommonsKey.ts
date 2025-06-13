import { AnyObject } from "@rue/types";
import { Input, RequiredInput, TypeConfig, v, validateInput } from "../component/Input";
import { isFunction } from "@rue/utils";



export type CommonsEntryKey<T = unknown> = (value: T) => [CommonsEntryKey<T>, T]






// export const commonsTypeMap: Map<CommonsEntryKey, TypeConfig> = new Map();


// export function CommonsKey<D extends TypeConfig, M>(typeDef: D, access?: M & MutabilityMarker): CommonsKeyReturn<D, M> {
//    switch (access) {
//       case 'm':
//          return createProviderKey(typeDef, 'm') as CommonsKeyReturn<D, M>

//       case 'mu':
//          return createProviderKey(typeDef, 'mu') as CommonsKeyReturn<D, M>

//       case 'm?':
//          return [createProviderKey(typeDef), createProviderKey(typeDef, 'm')] as CommonsKeyReturn<D, M>

//       case 'mu?':
//          return [createProviderKey(typeDef), createProviderKey(typeDef, 'mu')] as CommonsKeyReturn<D, M>

//       default:
//          return createProviderKey(typeDef) as CommonsKeyReturn<D, M>
//    }
// }

// export function CommonsKey<T>() {
//    return function entryKey(value: T): [CommonsEntryKey<T>, T] {
//       return [entryKey, value]
//    }
// }


// export function CommonsOpKey<T extends Function>() {
//    return function opKey(value: T): [CommonsEntryKey<T>, T] {
//       return [opKey, value]
//    }
// }

// export function CommonsEventKey<T extends AnyObject>() {
//    return function eventKey(value: (event: T) => void): [CommonsEntryKey<(event: T) => void>, (event: T) => void] {
//       return [eventKey, value]
//    }
// }


type FnKey = CommonsEntryKey & { commonsKey: string }

export function mapCommonsKeys(map: { [key: string]: CommonsEntryKey[] }) {
   for (const key in map) {
      const fnKeys = map[key];
      for (const fnKey of fnKeys) {
         (fnKey as FnKey).commonsKey = key
      }
   }
}

export function getCommonsKey(key: CommonsEntryKey | string): string {
   if (typeof key === 'string') return key;
   if ('commonsKey' in key)
      return key.commonsKey as string
   return key.name
}

// export function isOpKey(key: string) {
//    return key.startsWith('CAN_')
// }

// export function isEventKey(key: string) {
//    return key.startsWith('ON_')
// }


//TODO: should we validate at provide() or validate at fromCommons()?
// - required/optional/ toDefault
// - readonly reined
// - normalize reactivity

// [ ] Runtime validation and normalization of reactive type. Defaults
//     - fromTag()
//     - fromCommons()
// 
// [ ] Read-only and Reined conversion
//     - fromTag()
//     - fromCommons()
//     - ref()

// const [HELLO, MU_HELLO] = CommonsKey(v<{ dog: string }>, 'm?')
// const [HELLOA, MU_HELLOA] = CommonsKey(v<{ dog: string }>, 'mu?')
// const HELLOV = CommonsKey(v<{ dog: string }>, 'm')
// const HELLOC = CommonsKey(v<{ dog: string }>, 'mu')
// const HELLOD = CommonsKey(v<{ dog: string }>)

// const [OHELLO, OMU_HELLO] = CommonsKey(v<{ dog: string }>('?'), 'm?')
// const [OHELLOA, OMU_HELLOA] = CommonsKey(v<{ dog: string }>('?'), 'mu?')
// const OHELLOV = CommonsKey(v<{ dog: string }>('?'), 'm')
// const OHELLOC = CommonsKey(v<{ dog: string }>('?'), 'mu')
// const OHELLOD = CommonsKey(v<{ dog: string }>('?'))

// const OHELLOD = CommonsKey(v<{ dog: string }>, 'm')
// const OHELLOD = CommonsKey(v<{ dog: string }>, 'm?')
// const OHELLOD = CommonsKey(v<{ dog: string }>, 'mu')
// const OHELLOD = CommonsKey(v<{ dog: string }>, 'mu?')



// const DOHELLOD = CommonsKey(
//    v('?')({ dog: 'hi' })
// )

// const DOHELLODWORLD = CommonsKey(v<string>('?')('hi'))



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














import { Input, RequiredInput, TypeConfig, v, validateInput } from "../component/InputTypes";
import { fromApp } from "./provide";


export type RawInput<D> = D extends RequiredInput ? Input<D> : Input<D> | undefined

export type CommonsEntryKey<D = TypeConfig> = {
   (value: RawInput<D>): [CommonsEntryKey, unknown];
   [TYPE_DEF]: TypeConfig;
}


type CommonsKeyReturn<D, M> =
   M extends 'm' | 'mu' ? CommonsEntryKey<D>
   : M extends 'm?' | 'mu?' ? [CommonsEntryKey<D>, CommonsEntryKey<D>]
   : CommonsEntryKey<D>



// export const commonsTypeMap: Map<CommonsEntryKey, TypeConfig> = new Map();


export function CommonsKey<D extends TypeConfig, M>(typeDef: D, access?: M & MutabilityMarker): CommonsKeyReturn<D, M> {
   switch (access) {
      case 'm':
         return createProviderKey(typeDef, 'm') as CommonsKeyReturn<D, M>

      case 'mu':
         return createProviderKey(typeDef, 'mu') as CommonsKeyReturn<D, M>

      case 'm?':
         return [createProviderKey(typeDef), createProviderKey(typeDef, 'm')] as CommonsKeyReturn<D, M>

      case 'mu?':
         return [createProviderKey(typeDef), createProviderKey(typeDef, 'mu')] as CommonsKeyReturn<D, M>

      default:
         return createProviderKey(typeDef) as CommonsKeyReturn<D, M>
   }
}



export const TYPE_DEF = Symbol('type def')

function createProviderKey(typeDef: TypeConfig, access?: 'mu' | 'm' | undefined) {
   function providerKey(value: unknown) {
      return [providerKey, value] as [CommonsEntryKey, unknown]
   }
   typeDef.access = access;
   providerKey[TYPE_DEF] = typeDef
   return providerKey;
}


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


type MutabilityMarker = 'm' | 'm?' | 'mu' | 'mu?'


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







export function createInjectedClass(classKey: CommonsEntryKey, contextualGetter: (key: CommonsEntryKey) => any = fromApp) {
   return (...args: any[]) => new (contextualGetter(classKey))(...args)
}

export function createInjectedFactory(classKey: CommonsEntryKey, contextualGetter: (key: CommonsEntryKey) => any = fromApp) {
   return (...args: any[]) => contextualGetter(classKey)(...args)
}







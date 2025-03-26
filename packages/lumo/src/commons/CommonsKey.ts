import { OptionalInputKey, RequiredInputKey } from "../component/fromTag";
import { Input, OptionalInput, RequiredInput, v } from "../component/InputTypes";
import { fromApp } from "./provide";

type TypeConfig = { name: string }

type ProviderKey<D = TypeConfig> = (value: D extends RequiredInput ? Input<D> : Input<D> | undefined) => [ProviderKey, any]

type CommonsKeyReturn<D, M> =
   M extends 'm' | 'mu' ? ProviderKey<D>
   : M extends 'm?' | 'mu?' ? [ProviderKey<D>, ProviderKey<D>]
   : ProviderKey<D>



export const commonsTypeMap: Map<ProviderKey, TypeConfig> = new Map();


export function CommonsKey<D extends TypeConfig, M>(typeDef: D, mutability?: M & MutabilityMarker): CommonsKeyReturn<D, M> {
   switch (mutability) {
      case 'm':
         return createReinedObjKey(typeDef) as CommonsKeyReturn<D, M>

      case 'mu':
         return createMutableObjKey(typeDef) as CommonsKeyReturn<D, M>

      case 'm?':
         return [createProviderKey(typeDef), createReinedObjKey(typeDef)] as CommonsKeyReturn<D, M>

      case 'mu?':
         return [createProviderKey(typeDef), createMutableObjKey(typeDef)] as CommonsKeyReturn<D, M>

      default:
         return createProviderKey(typeDef) as CommonsKeyReturn<D, M>
   }
}

function createProviderKey(typeDef: TypeConfig) {
   function providerKey(value: unknown) {
      //TODO: validate required/optional? validate reactive type?
      return [providerKey, asReadonly(value)] as [ProviderKey, unknown]
   }
   commonsTypeMap.set(providerKey, typeDef)
   return providerKey;
}
function createMutableObjKey(typeDef: TypeConfig) {
   function mutableObjKey(value: unknown) {
      return [mutableObjKey, value] as [ProviderKey, unknown]
   }
   commonsTypeMap.set(mutableObjKey, typeDef)
   return mutableObjKey;
}

function createReinedObjKey(typeDef: TypeConfig) {
   function reinedObjectKey(value: unknown) {
      return [reinedObjectKey, asReined(value)] as [ProviderKey, unknown]
   }
   commonsTypeMap.set(reinedObjectKey, typeDef)
   return reinedObjectKey;
}




const [HELLO, MU_HELLO] = CommonsKey(v<{ dog: string }>, 'm?')
const [HELLOA, MU_HELLOA] = CommonsKey(v<{ dog: string }>, 'mu?')
const HELLOV = CommonsKey(v<{ dog: string }>, 'm')
const HELLOC = CommonsKey(v<{ dog: string }>, 'mu')
const HELLOD = CommonsKey(v<{ dog: string }>)

const [OHELLO, OMU_HELLO] = CommonsKey(v<{ dog: string }>('?'), 'm?')
const [OHELLOA, OMU_HELLOA] = CommonsKey(v<{ dog: string }>('?'), 'mu?')
const OHELLOV = CommonsKey(v<{ dog: string }>('?'), 'm')
const OHELLOC = CommonsKey(v<{ dog: string }>('?'), 'mu')
const OHELLOD = CommonsKey(v<{ dog: string }>('?'))

const DOHELLOD = CommonsKey(
   v('?')({ dog: 'hi' })
)

const DOHELLODWORLD = CommonsKey(v<string>('?')('hi'))



OHELLOD({ dog: '' })
HELLOD({ dog: '' })
DOHELLOD({ dog: 'sk' })


type MutabilityMarker = 'm' | 'm?' | 'mu' | 'mu?'


type ImmutableInput<S> = S extends { key: infer K } ? K extends string ?
   K extends RequiredInputKey<K, S> ? Input<S>
   : K extends OptionalInputKey<K, S> ? Input<S> | undefined
   : never : never : never

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







export function createInjectedClass(classKey: string | symbol, contextualGetter: (key: string | symbol) => any = fromApp) {
   return (...args: any[]) => new (contextualGetter(classKey))(...args)
}

export function createInjectedFactory(classKey: string | symbol, contextualGetter: (key: string | symbol) => any = fromApp) {
   return (...args: any[]) => contextualGetter(classKey)(...args)
}







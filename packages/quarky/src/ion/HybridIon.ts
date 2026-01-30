import { $_derivation, Ion, MutableIon } from "./Ion"
import { sync, watch } from "../reactivity/Watcher"
import { AnyObject } from "@rue/types"

type HybridIonConfig<T = any> = {
   initial?: T,
   watch?: Ion,
   derive: Ion,
   changed?: (a: T, b: T) => boolean
}

export function createHybridIon(config: HybridIonConfig, props?: AnyObject) {
   const { derive, initial, watch: $watched } = config
   // const subject = config.watch ?? derive
   // const $state = Ion('initial' in config ? initial : derive(), {...props ?? {}, '@set'(e) {
   // }}) as MutableIon<any>

   // watch(subject, () => {
   //    $state.value = derive()
   // }, { phase: 'SYNC' })

   const $derived = Ion($watched ? (() => ($watched(), derive())) : derive)
   const $derive = Ion('initial' in config ? false : true)
   const $state = Ion('initial' in config ? initial : derive())

   return Ion(() => $derive() ? $derived() : $state(), {
      '@set': (value) => {
         $derive.value = false;
         $state.value = value
      }
   })
}


// export function createHybridIon<T>(derive: Derivation<T>, initial?: T, props?: AnyObject) {
//    const $derived = Ion(derive, { '#logAtoms': true })
//    const $state = Ion(initial ?? $derived(), props) as MutableIon<T>

//    watch($derived, () => {
//       $state.value = $derived()
//    }, { phase: 'SYNC'})

//    return $state;
// }


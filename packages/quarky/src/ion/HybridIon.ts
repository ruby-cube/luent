import { isFunction } from "@rue/utils"
import { Ion, MutableIon } from "./Ion"
import { sync, watch } from "../reactivity/watch"

type HybridIonConfig<T> = {
   initial?: T,
   watch?: Ion,
   derive: Derivation<T>
   changed?: (a: T, b: T) => boolean
}

type Derivation<T> = (current?: T, previous?: T) => T

function HybridIon<T>(config: Derivation<T> | HybridIonConfig<T>) {
   const derive = isFunction(config) ? config : config.derive
   const subject = isFunction(config) ? () => config() : 'watch' in config ? config.watch! : () => config.derive()
   const $state = Ion('initial' in config ? config.initial : undefined) as MutableIon<T>

   watch(subject, sync(({ current, previous }) => {
      $state.value = derive(current, previous)
   }), { eager: 'initial' in config ? false : true })

   return $state.value;
}

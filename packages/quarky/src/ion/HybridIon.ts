import { isFunction } from "@rue/utils"
import { Ion, MutableIon } from "./Ion"
import { sync, watch } from "../reactivity/Watcher"
// import { SYNC } from "@rue/lumo"
import { AnyObject } from "@rue/types"

type HybridIonConfig<T> = {
   initial?: T,
   watch?: Ion,
   derive: Derivation<T>
   changed?: (a: T, b: T) => boolean
}

type Derivation<T> = (previous?: T) => T

function HybridIon<T>(config: Derivation<T> | HybridIonConfig<T>) {
   const derive = isFunction(config) ? config : config.derive
   const subject = isFunction(config) ? () => config() : 'watch' in config ? config.watch! : () => config.derive()
   const $state = Ion('initial' in config ? config.initial : undefined) as MutableIon<T>

   watch(subject, sync(({ current, previous }) => {
      $state.value = derive(current, previous)
   }), { eager: 'initial' in config ? false : true })

   return $state.value;
}

export function createHybridIon<T>(derive: Derivation<T>, initial?: T, props?: AnyObject) {
   const $derived = Ion(derive)
   const $state = Ion(initial ?? $derived(), {...props?? {}, '@set'() {console.log('setting', derive)}}) as MutableIon<T>

   watch($derived, () => {
      $state.value = $derived()
   }, { phase: 'SYNC' })

   return $state;
}


   // const $states = fetchStates()
   // // const $selectedState = Ion(() => $states()[0])
   // const $selectedState = Ion(() => $states()[0], { value: null })

   // const $cities = fetchCities($selectedState)
   // const $selectedCity = Ion(() => /* $selectedState() */$cities()[0], { value: null })

   // export function fetchStates() {
   //    return AsyncIon([], async () => {
   //       await new Promise((res) => setTimeout(res, 500));
   //       return Object.keys(stateCities);
   //    })
   // }
   
   // export function fetchCities($state: Ion<string>) {
   //    return AsyncIon([], async () => {
   //       $state()
   //       await new Promise((res) => setTimeout(res, 500));
   //       return stateCities[$state()] ?? [];
   //    })
   // }
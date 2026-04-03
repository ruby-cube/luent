import { Ion, MutableIon } from "./Ion"
import { watch } from "../reactivity/Watcher"
import { AnyObject } from "@rue/types"
import { SYNC } from "../reactivity/RenderCycle"
import { createAtomicIon } from "./AtomicIon"

type HybridIonConfig<T = any> = {
   initial?: T,
   watch?: Ion,
   derive: (prev: any) => any,
   changed?: (a: T, b: T) => boolean
}

// TODO: Traceablility

export function createHybridIon(config: HybridIonConfig, setup?: AnyObject) {
   const { derive, initial, watch: $watched } = config
   const subject = $watched ?? derive
   const $state = createAtomicIon('initial' in config ? initial : derive(undefined), setup) as MutableIon<any>

   watch(subject, ({previous}) => {
      $state.value = derive(previous)
   }, { phase: SYNC })

   return $state;


   // const previous = new SimpleState(undefined)

   // const $derived = createMemoizedDerivation($watched ? (() => ($watched(), untracked(() => derive(previous.get())))) : derive)
   // const $state = createAtomicIon('initial' in config ? initial : derive(previous.get()), { devName: setup?.devName })

   // const shouldDerive = new SimpleState('initial' in config ? false : true)

   
   // watch($derived, () => {
   //    // $shouldDerive.value = true
   //    shouldDerive.set(true)
   // }, { phase: SYNC })
   
   // return ion((prev: any) => {
   //    previous.set(prev)
   //    return shouldDerive.get() ? $derived() : $state()
   // }, {
   //    '@set': (value: any) => {
   //       shouldDerive.set(false)
   //       // $shouldDerive.value =false
   //       $state.value = value
   //    }
   // })
}




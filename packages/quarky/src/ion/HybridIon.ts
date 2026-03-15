import { Ion, MutableIon } from "./Ion"
import { watch } from "../reactivity/Watcher"
import { AnyObject } from "@rue/types"
import { untracked } from "../reactivity/Compound"

type HybridIonConfig<T = any> = {
   initial?: T,
   watch?: Ion,
   derive: (prev: any) => any,
   changed?: (a: T, b: T) => boolean
}

// TODO: Traceablility

export function createHybridIon(config: HybridIonConfig, setup?: AnyObject) {
   const { derive, initial, watch: $watched } = config
   const subject = config.watch ?? derive
   const $state = Ion('initial' in config ? initial : derive(undefined), setup) as MutableIon<any>

   watch(subject, ({previous}) => {
      $state.value = derive(previous)
   }, { phase: 'SYNC' })
   return $state;

   // let _prev: any; // should this be SimpleState?

   // const $derived = Ion($watched ? (() => ($watched(), untracked(() => derive(_prev)))) : derive)
   // const $state = Ion('initial' in config ? initial : derive(_prev), { devName: setup?.devName })

   // let shouldDerive = 'initial' in config ? false : true

   // watch($derived, () => {
   //    shouldDerive = true // QUESTION: should this be SimpleState??
   // }, { phase: 'SYNC' })

   // return Ion((prev: any) => {
   //    _prev = prev
   //    return shouldDerive ? $derived() : $state()
   // }, {
   //    '@set': (value: any) => {
   //       shouldDerive = false;
   //       $state.value = value
   //    }
   // })
}
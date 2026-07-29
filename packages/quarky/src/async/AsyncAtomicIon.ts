import { AnyObject } from "@luent/types";
import { createAtomicIon } from "../ion/AtomicIon";
import { Ion } from "../ion/Ion";



export function pending(...ions: Ion[]) {
   for (const ion of ions) {
      if ('pending' in ion && ion.pending) {
         return true;
      }
   }
   return false;
}

export function erred(...ions: Ion[]) {
   for (const ion of ions) {
      if ('erred' in ion && ion.erred) {
         return true;
      }
   }
   return false;
}

export function loaded(...ions: Ion[]) {
   for (const ion of ions) {
      if ('loaded' in ion && !ion.loaded) {
         return false;
      }
   }
   return true;
}

export function createAsyncAtomicIon(promise: Promise<unknown>, standin: unknown, setup: AnyObject | undefined) {
   // TODO: add to await boundary
   const $loaded = createAtomicIon(false)
   const $pending = createAtomicIon(promise as Promise<unknown> | null)
   const $error = createAtomicIon(undefined as unknown | Error | null)

   const ion = createAtomicIon(standin, {
      ...setup,
      get pending() {
         return $pending()
      },
      get loaded() {
         return $loaded()
      },
      get erred() {
         return $error()
      }
   })

   promise
      .then(res => {
         ion.value = res
         $loaded.value = true
         $pending.value = null
         $error.value = null
      })
      .catch(error => {
         $pending.value = null
         $error.value = error
      })

   return ion
}


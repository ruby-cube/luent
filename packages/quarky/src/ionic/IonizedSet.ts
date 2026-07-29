import { AnyObject } from "@luent/types";
import { ionic, Ionic } from "./Ionic";
import { defineIonicCollection, IonicDef } from "./IonicDef";
import { trigger } from "../reactivity/Atom";

// TODO: type ionic set
// declare global {
//    interface Set<T> {
//       '~$methods'?: {
//          // Core methods
//          add<H>(this: H, value: T): H,

//          // Iteration methods
//          forEach<H, O>(
//             this: H,
//             callback: (this: O, valueA: MaybeIonized<T>, valueB: MaybeIonized<T>, set: H) => void,
//             thisArg: O
//          ): void;

//          keys(): IterableIterator<MaybeIonized<T>>;
//          values(): IterableIterator<MaybeIonized<T>>;
//          entries(): IterableIterator<[MaybeIonized<T>, MaybeIonized<T>]>;
//          [Symbol.iterator](): IterableIterator<MaybeIonized<T>>;
//       }
//    }
// }



export function installIonicSet() {
   defineIonicCollection(Set, {
      clone: set => new Set(set),
      '@initEach'(item, target, transform) {
         target.delete(item)
         target.add(transform(item))
      }
   }, {
      [Symbol.iterator]() {
         this.trackModel()
         return ionic(this.raw[Symbol.iterator]()) // TODO: Not sure yet, but the raw iterator may yield inconsistent current/pending state; however if this.ionic is used, the proxy receiver becomes invalid
      },
      forEach: SetlikeDef.forEach,
      keys: SetlikeDef.keys,
      values: SetlikeDef.values,
      entries: SetlikeDef.entries,

      difference(other) {
         this.trackModel()
         return ionic(this.raw.difference(other))
      }, // newSet = difference(otherSet) 

      union(other) {
         this.trackModel()
         return ionic(this.raw.union(other))
      },

      intersection(other) {
         this.trackModel()
         return ionic(this.raw.intersection(other))
      },
      
      symmetricDifference(other) {
         this.trackModel()
         return ionic(this.raw.symmetricDifference(other))
      },

      isSubsetOf(other) {
         this.trackModel()
         return this.raw.isSubsetOf(other)
      }, // boolean = isSubsetOf(otherSet)

      isSupersetOf(other) {
         this.trackModel()
         return this.raw.isSubsetOf(other)
      }, // boolean = isSupersetOf(otherSet)

      isDisjointFrom(other) {
         this.trackModel()
         return this.raw.isDisjointFrom(other)
      }, // boolean = isDisjointFrom(otherSet)

      add(value) {
         if (this.raw.has(value)) return ionic(this.raw);
         return ionic(this.mutate(raw => {
            return raw.add(value)
         }, ({ op }) => {
            op.trigger('has', value)
            op.trigger('[[get]]', 'size')
            op.triggerModel()
         })) // FIX: just return the proxy? or don't require config?
      },

      has: SetlikeDef.has,

      clear: SetlikeDef.clear,

      delete: SetlikeDef.delete,

      size: SetlikeDef.size
   })
}

interface Setlike<T> {
   forEach(
      callback: (value: T, value2: T, set: Setlike<T>) => void,
      thisArg?: any
   ): void;

   keys(): IterableIterator<T>;
   values(): IterableIterator<T>;
   entries(): IterableIterator<[T, T]>;

   has(value: T): boolean;
   delete(value: T): boolean;
   clear(): void;

   readonly size: number;
}

// type Setlike = Pick<Set<unknown> | Map<unknown, unknown>, 'forEach' | 'keys' | 'values' | 'entries' | 'has' | 'delete' | 'clear' | 'size'>


export const SetlikeDef: IonicDef<Setlike<unknown>> = {
   forEach(cb) {
      this.trackModel()
      return this.raw.forEach(cb)
   },

   keys() {
      this.trackModel()
      return ionic(this.raw.keys())
   },

   values() {
      this.trackModel()
      return ionic(this.raw.values())
   },

   entries() {
      this.trackModel()
      return ionic(this.raw.entries())
   },

   has(key) {
      this.track('has', key)
      return this.raw.has(key)
   },

   clear() {
      if (this.raw.size === 0) return;
      this.mutate(raw => raw.clear(), ({ op }) => {
         op.triggerModel()
         op.triggerAll('has')
         op.trigger('[[get]]', 'size')
      })
   },

   delete(key) {
      return this.mutate(raw => raw.delete(key), ({ output: success, op }) => {
         if (success) {
            op.triggerModel()
            op.trigger('has', key)
            op.trigger('[[get]]', 'size')
         }
      })
   },

   size: {
      get() {
         this.track('[[get]]', 'size')
         return this.raw.size
      }
   }
}


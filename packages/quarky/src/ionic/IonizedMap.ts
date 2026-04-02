import { defineIonicCollection } from "./IonicDef";
import { SetlikeDef } from "./IonizedSet";
import { asIonic, Ionic } from "./Ionic";

// declare global {
//    interface Map<K, V> {
//       '~$methods'?: undefined | {
//          // Core methods
//          delete(key: K): boolean;
//          get(key: K): MaybeIonized<V> | undefined;
//          has(key: K): boolean;
//          set<H>(this: H, key: K, value: V): H;

//          // Iteration methods
//          forEach<H, O>(
//             callback: (this: O, value: MaybeIonized<V>, key: K, map: H) => void,
//             thisArg?: O
//          ): void;
//          keys(): IterableIterator<K>;
//          values(): IterableIterator<MaybeIonized<V>>;
//          entries(): IterableIterator<[K, MaybeIonized<V>]>;
//          [Symbol.iterator](): IterableIterator<[K, MaybeIonized<V>]>;
//       }
//    }
// }


// Trackable keys vs trackable ops:
// Trackable keys is about tracking the property
// trackable ops is about tracking the get op or the whole ionic model (depending on the type of operation)

// Ionic(new Map(), {
//    [EACH]: { as: ([key, value]) => [Ionic(key), Ionic(value)] }
// })

export function installIonicMap() {
   defineIonicCollection(Map, {
      clone: map => new Map(map),
      '@initEach'(entry, target, transform) {
         target.delete(entry.key)
         const [key, value] = transform(entry) as [unknown, unknown]
         target.set(key, value)
      }
   }, {
      [Symbol.iterator]() {
         this.trackModel()
         return asIonic(this.raw[Symbol.iterator]()) // TODO: see note in $$Set
      },

      forEach: SetlikeDef.forEach,
      keys: SetlikeDef.keys,
      values: SetlikeDef.values,
      entries: SetlikeDef.entries,

      set(key, value) {
         return asIonic(this.mutate(raw => raw.set(key, value), ({ op }) => {
            op.trigger('has', key)
            op.trigger('get', key)
            op.trigger('[[get]]', 'size')
            op.triggerModel()
         }))
      },

      get(key) {
         this.track('get', key)
         return this.raw.get(key)
      },

      has: SetlikeDef.has,

      clear() {
         if (this.raw.size === 0) return;
         this.mutate(raw => raw.clear(), ({ op }) => {
            op.triggerModel()
            op.triggerAll('has')
            op.triggerAll('get')
            op.trigger('[[get]]', 'size')
         })
      },

      delete(key) {
         return this.mutate(raw => raw.delete(key), ({ output: success, op }) => {
            if (success) {
               op.triggerModel()
               op.trigger('has', key)
               op.trigger('get', key)
               op.trigger('[[get]]', 'size')
            }
         })
      },

      size: SetlikeDef.size

   })
}


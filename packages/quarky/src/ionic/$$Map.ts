import { defineIonicCollection } from "./IonicDef";
import { SetlikeDef } from "./$$Set";
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
         return Ionic(this.raw[Symbol.iterator]())
      },

      forEach: SetlikeDef.forEach,
      keys: SetlikeDef.keys,
      values: SetlikeDef.values,
      entries: SetlikeDef.entries,

      set(key, value) {
         const map = this.raw.set(key, value)
         this.trigger('has', key)
         this.trigger('[[get]]', 'size')
         this.triggerModel()
         return asIonic(map)
      },

      has: SetlikeDef.has,

      clear: SetlikeDef.clear,

      delete: SetlikeDef.delete,

      size: SetlikeDef.size

   })
}


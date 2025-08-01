import { toRaw } from "./ionize";
import { isNotSameSize } from "./IonizedSet";
import { enlistIonizedMethods, trigger, triggerAll } from "./IonizedMethods";
import { deleteOp, hasMaybeIonized, trackableIterative, trackableOp, trackableOpWithCallback, trackOp } from "./OpDefinitions";
import { noop } from "@rue/utils";
import { getIonizedModel, maybeIonize } from "./IonizedModel";

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

const trackableMapGetOps = {
   get: true, // value = get(key)  //NOTE: trackable ops
   has: true, // boolean = has(key) //NOTE: trackable ops
   // set: true,
   // delete: true,
   // clear: true,
   // forEach: true,
   // entries: true, // newEntriesIterator = entries()
   // keys: true, // newIterable = keys()
   // values: true, // newIterable = values()
   // size: true,
}

export function installIonicMap() {
   enlistIonizedMethods(Map, {
      has: {
         input: ([key]) => [toRaw(key)],
         op: function has(this: Map<unknown, unknown>, key: unknown) {
            return hasMaybeIonized(key, this, {
               passRaw: () => true,
               passIonized: (key, rawKey?) => {
                  const value = this.get(key)
                  this.delete(key)
                  this.set(rawKey, value)
                  return true;
               },
               fail: false
            })
         }
         ,
         track: trackOp,
      },
      get: {
         input: ([key]) => [toRaw(key)],
         op: function get(this: Map<unknown, unknown>, key: unknown) {
            return hasMaybeIonized(key, this, {
               passRaw: (key) => this.get(key),
               passIonized: (ionized, rawKey) => {
                  const value = this.get(ionized);
                  this.delete(ionized);
                  this.set(rawKey, value);
                  return value;
               },
               fail: undefined
            })
         },
         track: trackOp,
         output: maybeIonize
      },
      [Symbol.iterator]: trackableOpWithCallback,
      forEach: trackableIterative,
      keys: trackableOp,
      values: trackableOp,
      entries: trackableOp,
      set: {
         op: function set(this: Map<unknown, unknown>, key: unknown, value: unknown) {
            const ionizedKey = getIonizedModel(key);
            if (ionizedKey) this.delete(ionizedKey);
            return this.set(key, value)
         },
         input: ([key, value]) => [toRaw(key), toRaw(value)],
         preop: (target, [key, value]) => ({
            target,
            key,
            prevState: target.get(key),
         }),
         shouldTrigger: ({ prevState, key, target }) => prevState !== target.get(key),
         triggers: (ionized, [key], { prevSize, target }) => [
            trigger(ionized),
            trigger(ionized, 'has', key),
            trigger(ionized, 'get', key),
            prevSize !== target.size ? trigger(ionized, '[[get]]', 'size') : noop,
         ],
         revert(ionized, data) {
            ionized.delete(data.args[0])
         }
      },

      clear: {
         preop(target) {
            return { entries: Array.from(<Map<any, any>>target), prevSize: target.size, target }
         },

         shouldTrigger: isNotSameSize,

         triggers: (model) => [
            triggerAll(model, 'get'),
            triggerAll(model, 'has'),
            trigger(model, '[[get]]', 'size'),
            trigger(model)
         ],

         revert(ionizedModel, { preopData: { entries } }) {
            for (const [key, value] of entries) {
               ionizedModel.set(key, value) //QUESTION: not sure if this should be the raw target or the ionic model
            }
         }
      },

      delete: {
         input: ([key]) => [toRaw(key)],
         op: deleteOp,
         preop: (target, [key]) => ({
            target,
            key,
            value: target.get(key),
            prevSize: target.size
         }),
         shouldTrigger: isNotSameSize,
         triggers: (model, [key]) => [
            trigger(model),
            trigger(model, 'has', key),
            trigger(model, 'get', key),
            trigger(model, '[[get]]', 'size')
         ],
         revert(ionizedModel, { preopData: { key, value } }) {
            ionizedModel.set(key, value)
         }
      },

   })
}

// export function createIonicMap(
//     target: Map<any, any>,
//     methods: AnyObject | undefined
// ) {
//     const modelQuark = new MetaIonicCollection(target, methods)
//     const ionizedModel = new Proxy(target, {
//         get(target, key, receiver) {
//             if (__DEV__) emitSignal()
//             if (key === QUARK) return modelQuark
//             const reinedMeta = getReinedMeta(target, ionizedModel, receiver)
//             if (reinedMeta) {
//                 const keys = reinedMeta.propertyKeys
//                 if (keys && !(key in keys)) {
//                     if (__DEV__) console.warn(`Object is protected. Cannot access '${key.toString()}'`)
//                     return undefined;
//                 }
//             }
//             if (methods && key in methods) {
//                 return accessMethod(
//                     target,
//                     ionizedModel,
//                     receiver,
//                     key,
//                     boundMethodMap,
//                     methods[key]
//                 )
//             }
//             if (key in mutatingMapOps) {
//                 if (reinedMeta) {
//                     const keys = reinedMeta.propertyKeys
//                     if (keys && key in keys) {
//                         return accessMethod(
//                             target,
//                             ionizedModel,
//                             receiver,
//                             key,
//                             boundMethodMap
//                         )
//                     }
//                     return undefined;
//                 }
//             }

//             const value = Reflect.get(target, key, receiver)
//             if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
//                 return value;
//             }
//             if (isNonTrackable(key, Map))
//                 return value;
//             if (isIon(value)) return value();

//             if (isFunction(value))
//                 return accessMethod(
//                     target,
//                     ionizedModel,
//                     receiver,
//                     key,
//                     boundMethodMap,
//                     value
//                 )
//             const _value = maybeIonize(value, target, ionizedModel, receiver)
//             const tracker = getActiveTracker()
//             if (!tracker)
//                 return _value;
//             tracker.track(asPionQuark(ionizedModel, key))
//             return _value;
//         },
//         set(target, key, value, receiver) {
//             return reactiveSetter(
//                 Map,
//                 ionizedModel,
//                 modelQuark,
//                 target,
//                 key,
//                 value,
//                 receiver
//             )
//         }
//     }) as IonizedModel<Map<any, any>>


//     const boundMethodMap: Map<string | symbol, (...arg: any[]) => any> = new Map([
//         ['set', setOp],
//         ['has', useTrackableGetOp(
//             ionizedModel,
//             target,
//             'has',
//             target.has
//         )],
//         ['get', useTrackableGetOp(
//             ionizedModel,
//             target,
//             'get',
//             target.get
//         )],
//         ['clear', useClearOp(
//             ionizedModel,
//             modelQuark,
//             target
//         )],
//         ['delete', useDeleteOp(
//             ionizedModel,
//             modelQuark,
//             target
//         )]
//     ])

//     function setOp(key: any, newValue: any) {
//         const preopData = getPreopData(target)
//         const oldSize = target.size
//         const oldValue = target.get(key);
//         const _newValue = toRawIfNeeded(newValue)
//         const output = target.set(key, _newValue); //perform op
//         const newSize = target.size

//         if (oldValue === _newValue) return;

//         storeSnapshot(modelQuark)

//         const ionizedModel = modelQuark.ionizedModel!
//         if (oldSize !== newSize) {
//             const sizeProp = getObservedPion(ionizedModel, 'size')
//             if (sizeProp)
//                 trigger(sizeProp, newSize, oldSize);
//         }

//         const hasOp = $atomicOp(ionizedModel, 'has', key)
//         if (hasOp) triggerIonicAtom(hasOp);
//         const getOp = $atomicOp(ionizedModel, 'get', key)
//         if (getOp) triggerIonicAtom(getOp);

//         triggerIonizedModelWithMutation(
//             ionizedModel,
//             'set',
//             [key, _newValue],
//             output
//         )

//         return output;
//     }

//     modelQuark.initIonizedModel(ionizedModel)
//     registerIonizedModel(ionizedModel, target)
//     return ionizedModel
// }



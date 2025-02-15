import { storeSnapshot, ionize, registerIonizedModel, toRaw } from "./ionize";
import { nontrackableIterableKeys, useClearOp, useDeleteOp } from "./IonizedSet";
import { getAtomicOp } from "./AtomicOp";
import { defineIonizedStructure, useTrackableGetOp } from "./IonizedModel";
import { getAtomicPion } from "./Pion";
import { Mutation, recordMutation } from "../mutation/Mutable";

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
   defineIonizedStructure(Map, {
      nontrackableKeys: nontrackableIterableKeys,
      trackableOps: {
         has(target, ionizedModel) {
            return useTrackableGetOp(
               ionizedModel,
               target,
               'has',
               target.has
            )
         },
         get(target, ionizedModel) {
            return useTrackableGetOp(
               ionizedModel,
               target,
               'get',
               target.get
            )
         }
      },
      mutatingOps: {
         set: {
            createOp(target, model, quark) {

               return function set(key: any, newValue: any) { //QUESTION: do we need to toRaw the key?
                  const oldSize = target.size
                  const oldValue = target.get(key);
                  const _newValue = toRaw(newValue)
                  const output = target.set(key, _newValue); //perform op
                  const newSize = target.size

                  if (oldValue === _newValue) return;

                  storeSnapshot(quark)

                  recordMutation(quark, new Mutation(
                     model,
                     'set',
                     [key, _newValue],
                     output,
                     oldValue
                  ))

                  if (oldSize !== newSize) {
                     getAtomicPion(model, 'size')?.trigger()
                  }

                  getAtomicOp(model.has, key)?.trigger()
                  getAtomicOp(model.get, key)?.trigger()

                  return output;
               }
            },

            revert(model, data) {
               model.delete(data.args[0])
            }
         },
         clear: {
            createOp(target, ionizedModel, quark, getPreopData) {

               return useClearOp(
                  ionizedModel,
                  quark,
                  target,
                  getPreopData!
               )
            },

            preop(target) {
               return Array.from(<Map<any, any>>target)
            },

            revert(ionizedModel, { preopData }) {
               for (const [key, value] of preopData) {
                  ionizedModel.set(key, value) //QUESTION: not sure if this should be the raw target or the ionic model
               }
            }
         },
         delete: {
            createOp(target, ionizedModel, quark, getPreopData) {
               const deleteOp = useDeleteOp(
                  ionizedModel,
                  quark,
                  target,
                  getPreopData!
               )

               return (key: unknown) => {
                  const output = deleteOp(key)
                  getAtomicOp(ionizedModel.get, key)?.trigger()
                  return output;
               }
            },

            preop(model, args) {
               const key = args![0];
               const value = model.get(key)
               return { key, value }
            },

            revert(ionizedModel, { preopData }) {
               ionizedModel.set(preopData.key, preopData.value)
            }
         },

      }
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

//         const hasOp = getAtomicOp(ionizedModel, 'has', key)
//         if (hasOp) triggerIonicAtom(hasOp);
//         const getOp = getAtomicOp(ionizedModel, 'get', key)
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



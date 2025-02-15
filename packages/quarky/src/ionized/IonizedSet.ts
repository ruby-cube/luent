import { AnyObject } from "@rue/types";
import {storeSnapshot, toRaw } from "./ionize";
import { defineIonizedStructure, GetPreopData, IonizedModel, triggerIonizedModel, useTrackableGetOp } from "./IonizedModel";
import { getAtomicOp, triggerOp } from "./AtomicOp";
import { IonizedModelQuark } from "./IonizedModelQuark";
import { getObservedPion, triggerPion } from "./Pion";
import { Mutation } from "../actions/Mutable";
import { quarkOf } from "../Quark";

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

const trackableCollectionOps = {
   keys: true,  // newIterable = keys()
   entries: true, // newEntriesIterator = entries()
   values: true, // newIterable = values()
}

export const trackableIterableOps = {
   forEach: true,
   'Symbol.iterator': true
}

export const nontrackableIterableKeys = {
   forEach: true,
   'Symbol.iterator': true
}


const trackableSetOps = {
   has: true, // boolean = has(item) //NOTE: trackable ops

   // add: true,
   // delete: true,
   // clear: true,
   // forEach: true,
   // size: true,
   // entries: true, // newEntriesIterator = entries()
   // keys: true, // newIterable = keys()
   // values: true, // newIterable = values()

   difference: true, // newSet = difference(otherSet) 
   union: true,
   intersection: true,
   symmetricDifference: true,

   isSubsetOf: true, // boolean = isSubsetOf(otherSet)
   isSupersetOf: true, // boolean = isSupersetOf(otherSet)
   isDisjointFrom: true, // boolean = isDisjointFrom(otherSet)
}

export function installIonicSet() {
   defineIonizedStructure(Set, {
      nontrackableKeys: nontrackableIterableKeys, //FIX: I don't think this is correct
      trackableOps: {
         has(target, ionicModel) {
            return useTrackableGetOp(
               ionicModel,
               target,
               'has',
               target.has
            )
         },
         values(target, ionicModel){
            return useTrackableGetOp(
               ionicModel,
               target,
               'values',
               target.values
            )
         },
         entries(target, ionicModel){
            return useTrackableGetOp(
               ionicModel,
               target,
               'entries',
               target.entries
            )
         }
      },
      mutatingOps: {
         add: {
            createOp(target, ionicModel, meta) {

               return function add(newValue: any) {
                  const oldSize = target.size
                  const _newValue = toRaw(newValue)
                  const output = target.add(_newValue); //perform op
                  const newSize = target.size


                  if (oldSize === newSize) return;
                  storeSnapshot(meta)

                  const sizeProp = getObservedPion(ionicModel, 'size')
                  if (sizeProp)
                     trigger(sizeProp, newSize, oldSize);

                  const hasOp = getAtomicOp(ionicModel.has, _newValue)
                  if (hasOp) triggerIonicAtom(hasOp);

                  triggerIonizedModel(
                     ionicModel,
                     'add',
                     [_newValue],
                     output
                  )

                  return output;
               }
            },

            revert(model, data) {
               model.delete(data.args[0])
            }
         },
         clear: {
            createOp(target, ionicModel, meta, getPreopData) {
               return useClearOp(
                  ionicModel,
                  meta,
                  target,
                  getPreopData!
               )
            },

            preop(model) {
               return Array.from(<Set<any>>toRaw(model))
            },

            revert(ionicModel, { preopData }) {
               for (const value of preopData) {
                  ionicModel.add(value) //QUESTION: not sure if this should be the raw target or the ionic model
               }
            }
         },
         delete: {
            createOp(target, ionicModel, meta, getPreopData) {

               return useDeleteOp(
                  ionicModel,
                  meta,
                  target,
                  getPreopData!
               )
            },

            preop(target, args) {
               return target[args![0]]
            },

            revert(ionicModel, { preopData }) {
               ionicModel.add(preopData)
            }
         },

      }
   })
}


// export function createIonicSet(
//     target: Set<any>,
//     methods: AnyObject | undefined
// ) {
//     const modelQuark = new MetaIonicCollection(target, methods)

//     const ionicModel = new Proxy(target, {
//         get(target, key, receiver) {
//             if (__DEV__) emitSignal()
//             if (key === QUARK) return modelQuark
//             const reinedMeta = getReinedMeta(target, ionicModel, receiver)
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
//                     ionicModel,
//                     receiver,
//                     key,
//                     boundMethodMap,
//                     methods[key]
//                 )
//             }

//             if (key in mutatingSetOps) {
//                 if (reinedMeta) {
//                     const keys = reinedMeta.propertyKeys
//                     if (keys && key in keys) {
//                         return accessMethod(
//                             target,
//                             ionicModel,
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

//             if (isNonTrackable(key, Set))
//                 return value;

//             if (isIon(value))
//                 return value();

//             if (isFunction(value)) {
//                 return accessMethod(
//                     target,
//                     ionicModel,
//                     receiver,
//                     key,
//                     boundMethodMap,
//                     value
//                 )
//             }
//             const _value = maybeIonize(value, target, ionicModel, receiver)
//             const tracker = getActiveTracker()
//             if (!tracker)
//                 return _value;
//             tracker.track(asPionQuark(ionicModel, key))
//             return _value;
//         },
//         set(target, key, value, receiver) {
//             return reactiveSetter(
//                 Set,
//                 ionicModel,
//                 modelQuark,
//                 target,
//                 key,
//                 value,
//                 receiver
//             )
//         }
//     }) as IonizedModel<Set<any>>

// const boundMethodMap: Map<string | symbol, Function> = new Map([
//     ['has', useTrackableGetOp(
//         ionicModel,
//         target,
//         'has',
//         target.has
//     )],
//     ['add', addOp],
//     ['clear', useClearOp(
//         ionicModel,
//         modelQuark,
//         target
//     )],
//     ['delete', useDeleteOp(
//         ionicModel,
//         modelQuark,
//         target
//     )]
// ])

//     function addOp(newValue: any) {
//         const oldSize = target.size
//         const _newValue = toRaw(newValue)
//         const preopData = getPreopData(target, [_newValue])
//         const output = target.add(_newValue); //perform op
//         const newSize = target.size


//         if (oldSize === newSize) return;
//         storeSnapshot(modelQuark)

//         const sizeProp = getObservedPion(ionicModel, 'size')
//         if (sizeProp)
//             trigger(sizeProp, newSize, oldSize);

//         const hasOp = getAtomicOp(ionicModel, 'has', _newValue)
//         if (hasOp) triggerIonicAtom(hasOp);

//         triggerIonizedModel(
//             ionicModel,
//             'add',
//             [_newValue],
//             output,
//             preopData
//         )

//         return output;
//     }

//     modelQuark.initIonizedModel(ionicModel)
//     registerIonizedModel(ionicModel, target)
//     return ionicModel
// }




export function useDeleteOp(
   ionicModel: IonizedModel,
   modelQuark: IonizedModelQuark,
   target: AnyObject,
   getPreopData: GetPreopData
) {
   return function deleteOp(_key: any) {
      const key = toRaw(_key)
      const oldSize = target.size
      const preopData = getPreopData(target, [key])
      const output = target.delete(key); //perform op
      const newSize = target.size
      if (oldSize === newSize) return;

      storeSnapshot(modelQuark)

      const mutation = new Mutation(
         ionicModel,
         'delete',
         [key],
         output,
         preopData
      )

      modelQuark.recordOp?.(mutation)

      triggerPion(getObservedPion(ionicModel, 'size'), mutation)
      triggerOp(getAtomicOp(ionicModel.has, key), mutation)

      if (target instanceof Map) {
         triggerOp(getAtomicOp(ionicModel.get, key), mutation)
      }

      triggerIonizedModel(
         ionicModel,
         mutation
      )

      return output;
   }
}



export function useClearOp(
   ionicModel: IonizedModel,
   modelQuark: IonizedModelQuark,
   target: AnyObject,
   getPreopData: GetPreopData
) {
   return function clearOp() {
      const preopData = getPreopData(target)
      const oldSize = target.size
      const output = target.clear(); //perform op
      const newSize = target.size

      if (oldSize === newSize) return;

      storeSnapshot(modelQuark)

      const trackedEntries = modelQuark.observedEntryKeys
      if (trackedEntries) {
         for (const entryKey of trackedEntries) {
            const hasOp = getAtomicOp(ionicModel.has, entryKey)
            if (hasOp) triggerIonicAtom(hasOp);

            if (target instanceof Map) {
               const getOp = getAtomicOp(ionicModel.get, entryKey)
               if (getOp) triggerIonicAtom(getOp);
            }
         }
      }

      const sizeProp = getObservedPion(ionicModel, 'size')
      if (sizeProp)
         trigger(sizeProp, newSize, oldSize);


      triggerIonizedModel(
         ionicModel,
         'clear',
         [],
         output,
         preopData
      )

      return output;
   }
}



import { AnyObject } from "@rue/types";
import { storeSnapshot, toRaw } from "./ionize";
import { defineIonizedStructure, GetPreopData, IonizedModel, useTrackableGetOp } from "./IonizedModel";
import { getAtomicOp, getAtomicOps } from "./AtomicOp";
import { IonizedModelQuark } from "./IonizedModelQuark";
import { getAtomicPion } from "./Pion";
import { Mutation, recordMutation } from "../Mutable";
import { quarkOf } from "../Quark";
import { $syncEffects } from "../effect-cycle/SyncEffects";

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
         has(target, ionizedModel) {
            return useTrackableGetOp(
               ionizedModel,
               target,
               'has',
               target.has
            )
         },
         values(target, ionizedModel) {
            return useTrackableGetOp(
               ionizedModel,
               target,
               'values',
               target.values
            )
         },
         entries(target, ionizedModel) {
            return useTrackableGetOp(
               ionizedModel,
               target,
               'entries',
               target.entries
            )
         }
      },
      mutatingOps: {
         add: {
            createOp(target, ionizedModel, quark) {
               return function add(newValue: any) {
                  const oldSize = target.size
                  const _newValue = toRaw(newValue)
                  const output = target.add(_newValue); //perform op
                  const newSize = target.size

                  if (oldSize === newSize) return;

                  storeSnapshot(quark)

                  recordMutation(quark, new Mutation(
                     ionizedModel,
                     'add',
                     [_newValue],
                     output,
                     undefined
                  ))

                  quark.trigger()

                  getAtomicPion(ionizedModel, 'size')?.trigger()

                  getAtomicOp(ionizedModel.has, _newValue)?.trigger()

                     
                           $syncEffects().run()

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

            preop(model) {
               return Array.from(<Set<any>>toRaw(model))
            },

            revert(ionizedModel, { preopData }) {
               for (const value of preopData) {
                  ionizedModel.add(value) //QUESTION: not sure if this should be the raw target or the ionic model
               }
            }
         },
         delete: {
            createOp(target, ionizedModel, quark, getPreopData) {

               return useDeleteOp(
                  ionizedModel,
                  quark,
                  target,
                  getPreopData!
               )
            },

            preop(target, args) {
               return target[args![0]]
            },

            revert(ionizedModel, { preopData }) {
               ionizedModel.add(preopData)
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

//             if (key in mutatingSetOps) {
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

//             if (isNonTrackable(key, Set))
//                 return value;

//             if (isIon(value))
//                 return value();

//             if (isFunction(value)) {
//                 return accessMethod(
//                     target,
//                     ionizedModel,
//                     receiver,
//                     key,
//                     boundMethodMap,
//                     value
//                 )
//             }
//             const _value = maybeIonize(value, target, ionizedModel, receiver)
//             const tracker = getActiveTracker()
//             if (!tracker)
//                 return _value;
//             tracker.track(asPionQuark(ionizedModel, key))
//             return _value;
//         },
//         set(target, key, value, receiver) {
//             return reactiveSetter(
//                 Set,
//                 ionizedModel,
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
//         ionizedModel,
//         target,
//         'has',
//         target.has
//     )],
//     ['add', addOp],
//     ['clear', useClearOp(
//         ionizedModel,
//         modelQuark,
//         target
//     )],
//     ['delete', useDeleteOp(
//         ionizedModel,
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

//         const sizeProp = getObservedPion(ionizedModel, 'size')
//         if (sizeProp)
//             trigger(sizeProp, newSize, oldSize);

//         const hasOp = getAtomicOp(ionizedModel, 'has', _newValue)
//         if (hasOp) triggerIonicAtom(hasOp);

//         triggerIonizedModel(
//             ionizedModel,
//             'add',
//             [_newValue],
//             output,
//             preopData
//         )

//         return output;
//     }

//     modelQuark.initIonizedModel(ionizedModel)
//     registerIonizedModel(ionizedModel, target)
//     return ionizedModel
// }




export function useDeleteOp(
   ionizedModel: IonizedModel,
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

      recordMutation(modelQuark, new Mutation(
         ionizedModel,
         'delete',
         [key],
         output,
         preopData
      ))

      modelQuark.trigger()

      getAtomicPion(ionizedModel, 'size')?.trigger()
      getAtomicOp(ionizedModel.has, key)?.trigger()

         
      $syncEffects().run()

      return output;
   }
}



export function useClearOp(
   ionizedModel: IonizedModel,
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

      recordMutation(modelQuark, new Mutation(
         ionizedModel,
         'clear',
         [],
         output,
         preopData
      ))

      modelQuark.trigger()

      const hasOps = getAtomicOps(ionizedModel.has)
      if (hasOps) {
         for (const [_, atomicOp] of hasOps) {
            atomicOp.trigger()
         }
      }

      getAtomicPion(ionizedModel, 'size')?.trigger()

      $syncEffects().run()

      return output;
   }
}



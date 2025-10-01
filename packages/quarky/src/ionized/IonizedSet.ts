import { toRaw } from "./ionize";
import { getIonizedModel } from "./IonizedModel";
import { enlistIonizedMethods, MemberType, trackableCreativeOp, trackableOp, trackOp, useDeleteOp, useHasOp } from "./IonizedMethods";

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

// const trackableCollectionOps = {
//    keys: true,  // newIterable = keys()
//    entries: true, // newEntriesIterator = entries()
//    values: true, // newIterable = values()
// }

// export const trackableIterableOps = {
//    forEach: true,
//    'Symbol.iterator': true
// }




// const trackableSetOps = {
//    has: true, // boolean = has(item) //NOTE: trackable ops

//    // add: true,
//    // delete: true,
//    // clear: true,
//    // forEach: true,
//    // size: true,
//    // entries: true, // newEntriesIterator = entries()
//    // keys: true, // newIterable = keys()
//    // values: true, // newIterable = values()

//    difference: true, // newSet = difference(otherSet) 
//    union: true,
//    intersection: true,
//    symmetricDifference: true,

//    isSubsetOf: true, // boolean = isSubsetOf(otherSet)
//    isSupersetOf: true, // boolean = isSupersetOf(otherSet)
//    isDisjointFrom: true, // boolean = isDisjointFrom(otherSet)
// }

const hasOp = useHasOp((target, ionizedKey, rawKey) => {
   target.delete(ionizedKey)
   target.add(rawKey)
})

export function installIonicSet() {
   enlistIonizedMethods(Set, {
      has: {
         type: MemberType.TRACKABLE,
           privateState: true,
         input: ([key]) => [toRaw(key)],
         op: hasOp,
         track: trackOp,
      },
      [Symbol.iterator]: trackableOp,
      forEach: trackableOp,
      keys: trackableOp,
      values: trackableOp,
      entries: trackableOp,
      difference: trackableCreativeOp, // newSet = difference(otherSet) 
      union: trackableCreativeOp,
      intersection: trackableCreativeOp,
      symmetricDifference: trackableCreativeOp,

      isSubsetOf: trackableOp, // boolean = isSubsetOf(otherSet)
      isSupersetOf: trackableOp, // boolean = isSupersetOf(otherSet)
      isDisjointFrom: trackableOp, // boolean = isDisjointFrom(otherSet)

      // mutating
      add: {
         type: MemberType.MUTATING,
           privateState: true,
         op: function add(this: Set<unknown>, value: unknown) {
            const ionizedKey = getIonizedModel(value);
            if (ionizedKey) this.delete(ionizedKey);
            return this.add(value)
         },
         input: ([value]) => [toRaw(value)],
         preop: (target, [value]) => ({ prevSize: target.size, target, value }),
         trigger: (model, { prevSize, target, value }) => {
            if (prevSize === target.size) return;
            model.trigger();
            model.triggerOp('[[get]]', 'size');
            model.triggerOp('has', value)
         },
         revert(model, { preopData: { value } }) {
            model.delete(value)
         }
      },
      clear: {
         type: MemberType.MUTATING,
           privateState: true,
         preop(target) {
            return { entries: Array.from(<Set<any>>target), prevSize: target.size, target }
         },

         trigger: (model, { prevSize, target }) => {
            if (prevSize === target.size) return;
            model.triggerAllOps('has');
            model.triggerOp('[[get]]', 'size');
            model.trigger()
         },

         revert(model, { preopData: { entries } }) {
            for (const value of entries) {
               model.add(value) //QUESTION: not sure if this should be the raw target or the ionic model
            }
         }
      },
      delete: {
         type: MemberType.MUTATING,
           privateState: true,
         input: ([value]) => [toRaw(value)],
         op: useDeleteOp(hasOp),
         preop: (target, [value]) => ({
            target,
            value,
            prevSize: target.size
         }),
         trigger: (model, { prevSize, target, value }) => {
            if (prevSize === target.size) return;
            model.trigger(),
               model.triggerOp('has', value),
               model.triggerOp('[[get]]', 'size')
         },
         revert(ionizedModel, { preopData: { value } }) {
            ionizedModel.add(value)
         }
      },
      size: {
         get: {
            type: MemberType.TRACKABLE,
              privateState: true,
            track: trackOp
         }
      }
      // }
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

//         const hasOp = $atomicOp(ionizedModel, 'has', _newValue)
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




// export function useDeleteOp(
//    ionizedModel: IonizedModel,
//    modelQuark: ModelQuark,
//    target: AnyObject,
//    getPreopData: GetPreopData
// ) {
//    return function deleteOp(_key: any) {
//       const key = toRaw(_key)
//       const oldSize = target.size
//       const preopData = getPreopData(target, [key])
//       const output = target.delete(key); //perform op
//       const newSize = target.size
//       if (oldSize === newSize) return;

//       storeSnapshot(modelQuark)

//       recordMutation(modelQuark, new Mutation(
//          ionizedModel,
//          'delete',
//          [key],
//          output,
//          preopData
//       ))

//       modelQuark.trigger()

//       $atomicPion(ionizedModel, 'size')?.trigger()
//       $atomicOp(ionizedModel, 'has', key)?.trigger()

//       runSyncEffects()

//       return output;
//    }
// }





// export function useClearOp(
//    ionizedModel: IonizedModel,
//    modelQuark: ModelQuark,
//    target: AnyObject,
//    getPreopData: GetPreopData
// ) {
//    return function clearOp() {
//       const preopData = getPreopData(target)
//       const oldSize = target.size
//       const output = target.clear(); //perform op
//       const newSize = target.size

//       if (oldSize === newSize) return;

//       storeSnapshot(modelQuark)

//       recordMutation(modelQuark, new Mutation(
//          ionizedModel,
//          'clear',
//          [],
//          output,
//          preopData
//       ))

//       // custom triggers
//       modelQuark.trigger()

//       const hasOps = getAtomicOps(ionizedModel, 'has')
//       if (hasOps) {
//          for (const [_, atomicOp] of hasOps) {
//             atomicOp.trigger()
//          }
//       }

//       $atomicPion(ionizedModel, 'size')?.trigger()


//       runSyncEffects()

//       return output;
//    }
// }



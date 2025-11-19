import { toRaw } from "./ionize";
import { defineIonicStructure, trackableOp, trackOp, useDeleteOp, useHasOp } from "./IonicMethods";
import { getIonizedModel, maybeIonize } from "./Ionic";

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

const hasOp = useHasOp((target, rawKey, ionizedKey) => {
   target.set(rawKey, target.get(ionizedKey))
   target.delete(ionizedKey)
})


export function installIonicMap() {
   defineIonicStructure(Map, {
      has: {
         type: MemberType.TRACKABLE,
         privateState: true,
         input: ([key]) => [toRaw(key)],
         op: hasOp,
         track: trackOp,
      },
      get: {
         type: MemberType.TRACKABLE,
         privateState: true,
         input: ([key]) => [toRaw(key)],
         output: maybeIonize,
         op: function get(this: Map<unknown, unknown>, key: unknown) {
            const has = hasOp.apply(this, [key])
            if (has) return this.get(getIonizedModel(key))
            return undefined
         },
         track: trackOp,
      },
      [Symbol.iterator]: trackableOp,
      forEach: trackableOp,
      keys: trackableOp,
      values: trackableOp,
      entries: trackableOp,

      // Mutating
      set(key: unknown, value: unknown) {
         const rawValue = toRaw(value)


         const prevSize = this.raw.size
         const output = this.raw.set(key, value)
         this.triggerModel()
         this.trigger('has', key)
         this.trigger('get', key)
         if (this.raw.size !== prevSize) this.trigger('[[get]]', 'size')
         return output;
      },
      // {
      //    type: MemberType.MUTATING,
      //    privateState: true,
      //    op: function set(this: Map<unknown, unknown>, key: unknown, value: unknown) {
      //       const ionizedKey = getIonizedModel(key);
      //       if (ionizedKey) this.delete(ionizedKey);
      //       return this.set(key, value) // TODO: we need
      //    },
      //    input: ([key, value]) => [toRaw(key), toRaw(value)],
      //    preop: (target, [key, value]) => ({
      //       target,
      //       key,
      //       prevState: target.get(key),
      //       prevSize: target.size
      //    }),
      //    trigger: (model, { prevSize, prevState, target, key }) => {
      //       if (prevState !== target.get(key)) return;
      //       model.trigger();
      //       model.triggerOp('has', key);
      //       model.triggerOp('get', key);
      //       if (prevSize !== target.size) model.triggerOp('[[get]]', 'size');
      //    },
      //    revert(ionized, data) {
      //       ionized.delete(data.args[0])
      //    }
      // },

      clear() {
         const size = this.raw.size;
         if (size === 0) return;
         this.raw.clear()
         this.triggerModel()
         this.triggerAll('has')
         this.triggerAll('get')
         this.trigger('[[get]]', 'size')
      },

      delete(key) {
         const success = this.raw.delete(key)
         if (success) {
            this.triggerModel()
            this.trigger('has', key)
            this.trigger('get', key)
            this.trigger('[[get]]', 'size')
         }
         return success;
      },

      size: {
         get() {
            this.track('[[get]]', 'size')
            return this.raw.size
         }
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

//         const hasOp = getTrackedOp(ionizedModel, 'has', key)
//         if (hasOp) triggerIonicAtom(hasOp);
//         const getOp = getTrackedOp(ionizedModel, 'get', key)
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



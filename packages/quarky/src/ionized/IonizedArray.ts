import { AnyObject } from "@rue/types";
import { isIonizedModel, storeSnapshot, toRaw, Ionized, ionize, } from "./ionize";
import { AtomicOp, getAtomicOp } from "./AtomicOp";
import { defineIonizedStructure, GetPreopData, IonizedModel, useTrackableGetOp } from "./IonizedModel";
import { nontrackableIterableKeys } from "./IonizedSet";
import { getAtomicPion, PionQuark, triggerPion } from "./Pion";
import { Mutation, recordMutation } from "../mutation/Mutable";
import { IonizedModelQuark } from "./IonizedModelQuark";

// type MaybeIonized<T> = T extends AnyObject ? Ionized<T> : T;

// declare global {
//    interface Array<T> {
//       '~$methods'?: {
//          // Accessor methods
//          at(index: number): MaybeIonized<T> | undefined;
//          concat(...items: (T | T[])[]): MaybeIonized<T>[];
//          slice(start?: number, end?: number): MaybeIonized<T>[];

//          // Mutator methods
//          copyWithin(target: number, start: number, end?: number): MaybeIonized<T>[];
//          fill(value: T, start?: number, end?: number): MaybeIonized<T>[];
//          pop(): MaybeIonized<T> | undefined;
//          push(...items: MaybeIonized<T>[]): number;
//          reverse(): MaybeIonized<T>[];
//          shift(): MaybeIonized<T> | undefined;
//          sort(compareFn?: (a: T, b: T) => number): MaybeIonized<T>[];
//          splice(start: number, deleteCount?: number, ...items: T[]): MaybeIonized<T>[];

//          forEach<H, O>(
//             this: H,
//             callback: (this: O, value: T, index: number, array: H) => void,
//             thisArg?: O
//           ): void;
//          map<U, H, O>(
//             this: H,
//             callback: (this: O, value: MaybeIonized<T>, index: number, array: H) => U, //QUESTION: should the array be ionized?
//             thisArg?: O
//          ): U[];
//          filter<H, O>(
//             this: H,
//             predicate: (this: O, value: MaybeIonized<T>, index: number, array: H) => boolean,
//             thisArg?: O
//          ): MaybeIonized<T>[];
//          find<H, O>(
//             this: H,
//             predicate: (this: O,value: MaybeIonized<T>, index: number, array: H) => boolean,
//             thisArg?: O
//          ): MaybeIonized<T> | undefined;

//          reduce<U, H>(
//             this: H,
//             callback: (accumulator: U, currentValue: T, index: number, array: H) => U,
//             initialValue: U
//          ): U;
//          reduceRight<U, H>(
//             this: H,
//             callback: (accumulator: U, currentValue: T, index: number, array: H) => U,
//             initialValue: U
//          ): U;

//          // Methods introduced in ES2023
//          toSorted(compareFn?: (a: MaybeIonized<T>, b: MaybeIonized<T>) => number): MaybeIonized<T>[];
//          toReversed(): MaybeIonized<T>[];
//          with(index: number, value: T): MaybeIonized<T>[];

//          [Symbol.iterator](): IterableIterator<MaybeIonized<T>>;
//       }
//    }
// }

// const dogs = ionize([{ name: 'lo' }])

// const jim = dogs.at(0)

const trackableArrayOps = {

   // whole array, triggered by any change to array

   toReversed: true, // newArray = toReversed()
   flat: true, // newArray = flat(depth?)
   toSorted: true, // newArray = toSorted(compareFn?)
   flatMap: true, // newArray = flatMap(callbackFn, thisArg?)
   map: true, // newArray = map(callbackFn, thisArg?)
   reduce: true, // result = reduce(callbackFn, initialValue?)
   reduceRight: true, // result = reduceRight(callbackFn, initialValue?)

   join: true, // string = join(separator?)
   toLocaleString: true, // string = toLocaleString() 
   toString: true, // string = toString()


   // check if result changed
   lastIndexOf: true, // index = lastIndexOf(item, fromIndex)
   indexOf: true, // index = indexOf(item, fromIndex)
   includes: true, // boolean = includes(item, fromIndex?)

   // args
   find: true, // item = find(callbackFn, thisArg?)
   findLast: true, // item = findLast(callbackFn, thisArg?)

   findIndex: true, // index = findIndex(callbackFn, thisArg?)
   findLastIndex: true, // index = findLastIndex(callbackFn, thisArg?)

   filter: true, // newArray = filter(callbackFn, thisArg?)

   every: true, // boolean = every(callbackFn, thisArg?)
   some: true, // boolean = some(callbackFn, thisArg?)


   // copyWithin: true,
   // fill: true,
   // pop: true,
   // push: true,
   // shift: true,
   // unshift: true,
   // reverse: true,
   // sort: true,
   // splice: true,

   // keys: true,  // newIterable = keys()
   // entries: true, // newEntriesIterator = entries()
   // values: true, // newIterable = values()
   // forEach: true,


   slice: true, // newArray = slice(start?, end?)

   concat: true, // newArray = concat(arrayB, arrayC, ...)
   toSpliced: true, // newArray = toSpliced(start?, deleteCount?, item1, item2, /* …, */ itemN)

   with: true, // newArray = arrayInstance.with(index, value)
}

export function installIonicArray() {
   defineIonizedStructure(Array, {
      nontrackableKeys: nontrackableIterableKeys,

      trackableOps: {
         at(target, ionizedModel) {
            return useTrackableGetOp(
               ionizedModel,
               target,
               'at',
               target.at
            )
         }
         //TODO: Trackable ops (as oppsed to get ops)?? not sure if necessary yet
      },

      mutatingOps: {
         push: {
            createOp: useMutatingArrayOpFactory('push', deionizeArgs),
            preop(model) {
               return model.length
            },
            revert(model, { preopData: length, args }) {
               model.splice(length, args.length)
            }
         },

         pop: {
            createOp: createPopMethod,
            revert(model, { output }) {
               model.push(output)
            }
         },

         unshift: {
            createOp: useMutatingArrayOpFactory('unshift', deionizeArgs),
            revert(model, { args }) {
               model.splice(0, args.length)
            }
         },

         shift: {
            createOp: useMutatingArrayOpFactory('shift'),
            revert(model, { output }) {
               model.unshift(output)
            }
         },

         splice: {
            createOp: useMutatingArrayOpFactory('splice', deionizeArgs),
            revert(model, { output, args }) {
               const start = args[0];
               const numItems = args.length - 2;
               model.splice(start, numItems, ...output)
            }
         },

         copyWithin: {
            createOp: useMutatingArrayOpFactory('copyWithin'),
            preop: fillOrCopyWithinPreop,
            revert: fillOrCopyWithinRevert
         },

         fill: {
            createOp: useMutatingArrayOpFactory('fill', (args: any) => toRaw(args[0])),
            preop: fillOrCopyWithinPreop,
            revert: fillOrCopyWithinRevert
         },

         reverse: {
            createOp: useMutatingArrayOpFactory('reverse'),
            revert(model) {
               model.reverse()
            }
         },

         sort: {
            createOp: useMutatingArrayOpFactory('sort'),
            preop(model) {
               return model.slice()
            },
            revert(model, { preopData: snapshot }) {
               for (let i = 0; i < model.length; i++) {
                  model[i] = snapshot[i]
               }
            }
         },
      },

      afterSet(ionizedModel, quark, key, newValue, oldValue) {
         if (isIntegerKey(key)) {
            getAtomicOp(ionizedModel.at, key)?.trigger()
            return;
         }

         if (key !== 'length') {
            return;
         }

         const pions = quark.pions
         if (!pions) {
            return;
         }

         for (const [indexKey] of pions) {
            if (!isIntegerKey(indexKey)) continue;
            const index = parseInt(<string>indexKey)
            if (index >= newValue) {
               getAtomicPion(ionizedModel, indexKey)?.trigger()
               getAtomicOp(ionizedModel.at, index)?.trigger()
            }
            if (index > oldValue) {
               getAtomicOp(ionizedModel.at, index)?.trigger()
            }
         }
      }

      // isEntryKey(model, key) {
      //    return !!(model instanceof Array && isIntegerKey(key))
      // },
   })

   function useMutatingArrayOpFactory(
      opName: string,
      deionizeArgs?: (args: any[]) => any[]
   ) {
      return function createOp(target: AnyObject, ionizedModel: IonizedModel, quark: IonizedModelQuark, getPreopData: GetPreopData | undefined) {
         const fn = target[opName]
         return useMutatingArrayOp(
            ionizedModel,
            quark,
            <any[]>target,
            opName,
            fn,
            getPreopData,
            deionizeArgs
         )
      }
   }

   const lengthMutatingOps = {
      push: true,
      pop: true,
      shift: true,
      unshift: true,
   }

   function useMutatingArrayOp(
      model: IonizedModel,
      modelQuark: IonizedModelQuark,
      target: any[],
      key: string,
      fn: Function,
      getPreopData?: ((target: any[], args: any[]) => any),
      deionizeArgs?: (args: any[]) => any[]
   ) {
      return (...args: any[]) => {
         const preopData = getPreopData ? getPreopData(target, args) : undefined
         const _args = deionizeArgs ? deionizeArgs(args) : args
         const prevLength = target.length;
         const output = fn.apply(model, _args); // perform mutation
         const newLength = target.length;

         if (key in lengthMutatingOps && prevLength === newLength) return output;

         storeSnapshot(modelQuark)

         recordMutation(modelQuark, new Mutation(
            model,
            key,
            _args,
            output,
            preopData
         ))

         modelQuark.trigger()

         getAtomicPion(model, 'length')?.trigger()

         //FIX: These need to be different depending on the op
         triggerObservedIndices(model, modelQuark.pions, prevLength, newLength)

         return output;
      }
   }

   //TODO: these need to be specialized to the different methods...
   function triggerObservedIndices(model: IonizedModel, pions: IonizedModelQuark['pions'], prevLength: number, newLength: number) {
      if (pions && prevLength < newLength) {
         for (const [indexKey] of pions) {
            if (!isIntegerKey(indexKey)) continue;
            const index = parseInt(<string>indexKey)
            if (index >= newLength) {
               getAtomicPion(model, indexKey)?.trigger()
               getAtomicOp(model.at, index)?.trigger()
            }
         }
      }
   }

   function createPopMethod(target: AnyObject, ionizedModel: IonizedModel, quark: IonizedModelQuark, getPreopData: GetPreopData | undefined) {
      const performOp = useMutatingArrayOp(
         ionizedModel,
         quark,
         <any[]>target,
         'pop',
         target.pop,
         getPreopData,
         deionizeArgs
      )

      return () => {
         const prevLength = target.length;
         const output = performOp()
         getAtomicPion(ionizedModel, (prevLength - 1).toString())?.trigger()
         getAtomicOp(ionizedModel.at, - 1)?.trigger()
         return output;
      }
   }


   function fillOrCopyWithinPreop(model: AnyObject, args: any[] | undefined) {
      const start = args![1] ?? 0
      const end = args![2]
      return model.slice(start, end)
   }

   function fillOrCopyWithinRevert(model: AnyObject, data: { preopData: any[], args: any[] }) {
      const { preopData: slice, args } = data

      let index = args![1] ?? 0;
      for (let i = 0; i < slice.length; i++) {
         model[index] = slice[i];
         index++;
      }
   }

   function deionizeArgs(args: any[]) {
      const _args = []
      for (const arg of args) {
         _args.push(toRaw(arg))
      }
      return _args;
   }
}




export function isIntegerKey(key: unknown) {
   const keyAsNumber = Number(key);
   if (isNaN(keyAsNumber)) return false;
   if (Number.isInteger(keyAsNumber)) return true
}


export function isIonizedArray(target: any): target is IonizedModel {
   if (!isIonizedModel(target)) return false;
   if (toRaw(target) instanceof Array) return true;
   return false;
}
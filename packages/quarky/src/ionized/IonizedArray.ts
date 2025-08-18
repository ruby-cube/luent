import { AnyObject } from "@rue/types";
import { isIonizedModel, toRaw, ionize, IonizeBy, ToRaw, } from "./ionize";
import { IonizedModel, maybeIonize, $atomicPion } from "./IonizedModel";
import { MutatingOpDef, IonizedMethodsDef, TrackableOpDef, OpType, trackModel, enlistIonizedMethods, Constructor, trackableOp } from "./IonizedMethods";
import { trackParticle } from "../compound/Compound";


declare global {
   interface Array<T> {
      values<H>(): ArrayIterator<IonizeBy<H, T>>;
      entries<H>(): ArrayIterator<IonizeBy<H, T>>;

      at<H>(index: number): IonizeBy<H, T> | undefined;
      concat<H>(...items: (IonizeBy<H, T> | IonizeBy<H, T>[])[]): IonizeBy<H, ToRaw<T>[]>;
      slice<H>(start?: number, end?: number): IonizeBy<H, ToRaw<T>[]>;

      // // Mutator methods
      copyWithin<H>(target: number, start: number, end?: number): IonizeBy<H, ToRaw<T>[]>;
      fill<H>(value: IonizeBy<H, T>, start?: number, end?: number): IonizeBy<H, ToRaw<T>[]>;
      pop<H>(): IonizeBy<H, T> | undefined;
      push<H>(...items: IonizeBy<H, T>[]): number;
      reverse<H>(): IonizeBy<H, ToRaw<T>[]>;
      shift<H>(): IonizeBy<H, T> | undefined;
      sort<H>(compareFn?: (a: IonizeBy<H, T>, b: IonizeBy<H, T>) => number): IonizeBy<H, ToRaw<T>[]>;
      splice<H>(this: H, start: number, deleteCount?: number, ...items: IonizeBy<H, T>[]): IonizeBy<H, ToRaw<T>[]>;

      forEach<H, O>(
         this: H,
         callback: (this: O, value: IonizeBy<H, T>, index: number, array: H) => void,
         thisArg?: O
      ): void;
      map<U, H, O>(
         this: H,
         callback: (this: O, value: IonizeBy<H, T>, index: number, array: H) => U, //QUESTION: should the array be ionized?
         thisArg?: O
      ): IonizeBy<H, T>[];
      filter<H, O>(
         this: H,
         predicate: (this: H, value: IonizeBy<H, T>, index: number, array: H) => boolean,
         thisArg?: O
      ): IonizeBy<H, T>[];
      find<H, O>(
         this: H,
         predicate: (this: O, value: IonizeBy<H, T>, index: number, array: H) => boolean,
         thisArg?: O
      ): IonizeBy<H, T> | undefined;

      reduce<U, H>(
         this: H,
         callback: (accumulator: U, currentValue: IonizeBy<H, T>, index: number, array: H) => U,
         initialValue: IonizeBy<H, U>
      ): IonizeBy<H, U>;
      reduceRight<U, H>(
         this: H,
         callback: (accumulator: U, currentValue: IonizeBy<H, T>, index: number, array: H) => U,
         initialValue: IonizeBy<H, U>
      ): IonizeBy<H, U>;

      // // Methods introduced in ES2023
      toSorted<H>(compareFn?: (a: IonizeBy<H, T>, b: IonizeBy<H, T>) => number): IonizeBy<H, T>[];
      toReversed<H>(): IonizeBy<H, T>[];
      with<H>(index: number, value: IonizeBy<H, T>): IonizeBy<H, T>[];

      //flat //TODO:
      //flatMap

      [Symbol.iterator]<H>(): IonizeBy<H, IterableIterator<ToRaw<T>>>;
      ionizable: 'Array'
   }
}

class Frog {
   name = 'kermit'
}

class Frogs extends Array<Frog> {
   length = 9
}

class Log {
   location = 'swamp'
}

class Logs extends Array<Log> {
   length: number = 1
}

declare global {
   interface Ionizables {
      Array: Array<unknown>
      Set: Set<unknown>
   }
}

declare global {
   interface Ionizables {
      LogsA: Logs
   }
}

type IsIonizable<T> = T extends Ionizables[keyof Ionizables] ? true : false



// How should these behave?

// 1. deep ionized array
// 2. array of ionized objects //This will fail identity checks because there is no way of intercepting methods like indexOf(). What is the most elegant mental model?
// 3. ion of ionized array
// 4. ionizing an array of ionized objects ... should the items be raw or ionized?
// - raw decoy, ionized decoy

// a. array output of any of these (e.g. .filter(), clone) should return an ionized model so that methods can be managed
// b. method that performs identity checks internally (e.g. indexOf()) should treat raw and ionized models as identical
// 

/*
 I don't want devs to have to worry about identity when working with raw and ionized models, 
 but because of unmanaged arrays of ionized objects, devs do have to track what is raw vs ionized..
 
 Which DX?
 A. Keep ionization invisible.
   - Discourage the creation of plain arrays of ionized objects/encourage ionizing everything.
   - Methods like .filter should return ionized model
   - Discourage using toRaw() and references to raw objects
   - disallows key transform?
   - provide an identity utility in place of x === y?
 B. Make ionization visible. Support tracking of what is ionized and what is not... via Typescript? 
   - requires complex re-typing of Array methods like splice
 */





// const todo = ionize({
//    id: 0
// })

// const todos = [todo]

// todos.indexOf(todo)

// const indexOp: TrackableOpDef = {
//    type: OpType.TRACKABLE,
//    // input: (args: any[]) => [toRaw(args[0]), args[1]]
// }



const arrayLengthMutatingOp: Omit<MutatingOpDef, 'type'> = {
   preop: (target) => ({ target, prevLength: target.length }),
   // shouldTrigger: ({ target, prevLength }) => target.length !== prevLength, // only for length mutating ops 
}

const creativeOp: TrackableOpDef = {
   type: OpType.TRACKABLE,
   output: ionize
}

enlistIonizedMethods(Array,
   {
      at: {
         type: OpType.TRACKABLE,
         // track: trackOp,
         output: maybeIonize
      },

      [Symbol.iterator]: trackableOp, // decoy

      // toReversed: creativeOp, // newArray = toReversed()
      // flat: creativeOp, // newArray = flat(depth?)
      // toSorted: trackableOp, // newArray = toSorted(compareFn?)
      // flatMap: creativeOp, // newArray = flatMap(callbackFn, thisArg?)
      // map: creativeOp, // newArray = map(callbackFn, thisArg?)
      // filter: creativeOp, // newArray = filter(callbackFn, thisArg?)

      concat: creativeOp, // newArray = concat(arrayB, arrayC, ...)
      // with: creativeOp, // newArray = arrayInstance.with(index, value)

      // reduce: trackableOp, // result = reduce(callbackFn, initialValue?)
      // reduceRight: trackableOp, // result = reduceRight(callbackFn, initialValue?)

      // join: trackableOp, // string = join(separator?)

      // forEach: trackableOp,//forEach(callbackFn, thisArg?)

      keys: trackableOp,  // newIterable = keys() //TODO: this does not need to track the entire model, just [[ownKeys]]
      // entries: trackableOp, // newEntriesIterator = entries()
      // values: trackableOp, // newIterable = values()

      // toLocaleString: trackableOp, // string = toLocaleString() 
      // toString: trackableOp, // string = toString()

      // find: trackableOp, // item = find(callbackFn, thisArg?)
      // findLast: trackableOp, // item = findLast(callbackFn, thisArg?)

      // findIndex: trackableOp, // index = findIndex(callbackFn, thisArg?)
      // findLastIndex: trackableOp, // index = findLastIndex(callbackFn, thisArg?)

      // every: trackableOp, // boolean = every(callbackFn, thisArg?)
      // some: trackableOp, // boolean = some(callbackFn, thisArg?)

      // depends on index //TODO: possible performance optimization if we trigger based on indices?
      // lastIndexOf: indexOp, // index = lastIndexOf(item, fromIndex?) //TODO: atomic op that includes fromIndex
      // indexOf: indexOp, // index = indexOf(item, fromIndex?)
      // includes: indexOp, // boolean = includes(item, fromIndex?)

      slice: creativeOp, // newArray = slice(start?, end?) 

      //TODO: test if this functions properly
      toSpliced: creativeOp,
      // newArray = toSpliced(start?, delete[Count?, item1, item2, /* …, */ itemN)
      // {
      //    type: OpType.TRACKABLE,
      //    input: (args) => args.map((item, index) => index < 2 ? item : toRaw(item)),
      //    // track: trackModel,
      //    output: maybeIonize,
      // }, 

      // MUTATING
      push: {
         type: OpType.MUTATING,
         preop: arrayLengthMutatingOp.preop,
         // shouldTrigger: arrayLengthMutatingOp.shouldTrigger,
         // triggers: () => [],
         // triggers: (model, _, { prevLength }) => [
         //    trigger(model),
         //    trigger(model, '[[get]]', 'length'),
         //    trigger(model, '[[get]]', (prevLength).toString()),
         // ],
         revert(model, { preopData: { prevLength }, args }) {
            model.splice(prevLength, args.length)
         }
      },

      pop: {
         type: OpType.MUTATING,
         preop: arrayLengthMutatingOp.preop,
         // shouldTrigger: arrayLengthMutatingOp.shouldTrigger,
         // triggers: () => [],
         // triggers: (model, _, { prevLength }) => [
         //    trigger(model, '[[get]]', (prevLength - 1).toString()),
         //    trigger(model, 'at', - 1),
         //    trigger(model),
         //    trigger(model, '[[get]]', 'length'),
         // ],
         revert: (model, { output }) => {
            model.push(output)
         }
      },

      unshift: {
         type: OpType.MUTATING,
         // input: ([value]) => [toRaw(value)],
         preop: arrayLengthMutatingOp.preop,
         // shouldTrigger: arrayLengthMutatingOp.shouldTrigger,
         // triggers: () => [],
         // triggers: (model) => [
         //    trigger(model),
         //    trigger(model, '[[get]]', 'length'),
         //    //TODO: trigger Observed Indices
         // ],
         revert(model, { args }) {
            model.splice(0, args.length)
         }
      },

      shift: {
         type: OpType.MUTATING,
         preop: arrayLengthMutatingOp.preop,
         // shouldTrigger: arrayLengthMutatingOp.shouldTrigger,
         // triggers: () => [],
         // triggers: (model) => [
         //    trigger(model),
         //    trigger(model, '[[get]]', 'length'),
         //    //TODO: trigger Observed Indices
         // ],
         revert(model, { output }) {
            model.unshift(output)
         }
      },

      splice: {
         type: OpType.MUTATING,
         // input: ([start, deleteCount, ...args]) => [start, deleteCount, ...deionizeArgs(args)],
         output: ionize,
         // triggers: () => [],
         // triggers: (model) => [
         //    trigger(model),
         //    trigger(model, '[[get]]', 'length'),
         //    //TODO: trigger Observed Indices
         // ],
         revert(model, { output, args }) {
            const start = args[0];
            const numItems = args.length - 2;
            model.splice(start, numItems, ...output)
         }
      },

      copyWithin: {
         type: OpType.MUTATING,
         preop: fillOrCopyWithinPreop,
         // triggers: () => [],
         // triggers: triggerModel,
         revert: fillOrCopyWithinRevert
      },

      fill: {
         type: OpType.MUTATING,
         // input: ([value]: Parameters<Array<any>['fill']> | any[]) => toRaw(value),
         preop: fillOrCopyWithinPreop,
         // triggers: triggerModel,
         // triggers: () => [],
         revert: fillOrCopyWithinRevert
      },

      reverse: {
         type: OpType.MUTATING,
         // triggers: () => [],
         // triggers: triggerModel,
         revert(model) {
            model.reverse()
         }
      },

      sort: {
         type: OpType.MUTATING,
         preop(model) {
            return model.slice()
         },
         // triggers: triggerModel,
         // triggers: () => [],
         revert(model, { preopData: snapshot }) {
            for (let i = 0; i < model.length; i++) {
               model[i] = snapshot[i]
            }
         }
      },
      length: {
         getterTask() {
            trackParticle(this.modelQuark!)
         }
      }
      // '[[set]]': {
      //    triggers: (model, [key, value]) => [
      //       trigger(model),
      //       isIntegerKey(key) ? trigger(model, 'at', key) : trigger(model, '[[get]]', key)
      //       //TODO: length should trigger observed indices

      //       // afterSet(ionizedModel, quark, key, newValue, oldValue) {
      //       //    if (isIntegerKey(key)) {
      //       //       $atomicOp(ionizedModel, 'at', key)?.trigger()
      //       //       return;
      //       //    }

      //       //    if (key !== 'length') {
      //       //       return;
      //       //    }

      //       //    const pions = quark.pions
      //       //    if (!pions) {
      //       //       return;
      //       //    }

      //       //    for (const [indexKey] of pions) {
      //       //       if (!isIntegerKey(indexKey)) continue;
      //       //       const index = parseInt(<string>indexKey)
      //       //       if (index >= newValue) {
      //       //          $atomicPion(ionizedModel, indexKey)?.trigger()
      //       //          $atomicOp(ionizedModel, 'at', index)?.trigger()
      //       //       }
      //       //       if (index > oldValue) {
      //       //          $atomicOp(ionizedModel, 'at', index)?.trigger()
      //       //       }
      //       //    }
      //       // }
      //    ]
      // }
   }
)
// function triggerModel(model: IonizedModel) { return [trigger(model)] }

// isEntryKey(model, key) {
//    return !!(model instanceof Array && isIntegerKey(key))
// },

// function useMutatingArrayOpFactory(
//    opName: string,
//    deionizeArgs?: (args: any[]) => any[]
// ) {
//    return function createOp(target: AnyObject, ionizedModel: IonizedModel, quark: ModelQuark, getPreopData: GetPreopData | undefined) {
//       const fn = target[opName]
//       return useMutatingArrayOp(
//          ionizedModel,
//          quark,
//          <any[]>target,
//          opName,
//          fn,
//          getPreopData,
//          deionizeArgs
//       )
//    }
// }



// function useMutatingArrayOp(
//    model: IonizedModel,
//    modelQuark: ModelQuark,
//    target: any[],
//    key: string,
//    fn: Function,
//    getPreopData?: ((target: any[], args: any[]) => any),
//    deionizeArgs?: (args: any[]) => any[]
// ) {

//    return (...args: any[]) => {
//       const preopData = getPreopData ? getPreopData(target, args) : undefined
//       const _args = deionizeArgs ? deionizeArgs(args) : args
//       const prevLength = target.length;

//       const output = fn.apply(target, _args); // perform mutation

//       const newLength = target.length;

//       if (key in lengthMutatingOps && prevLength === newLength) return output;

//       storeSnapshot(modelQuark)

//       recordMutation(modelQuark, new Mutation(
//          model,
//          key,
//          _args,
//          output,
//          preopData
//       ))

//       modelQuark.trigger()

//       $atomicPion(model, 'length')?.trigger()

//       //FIX: These need to be different depending on the op
//       triggerObservedIndices(model, modelQuark.pions, prevLength, newLength)

//       runSyncEffects()

//       return output;
//    }
// }

// function createPopMethod(target: AnyObject, ionizedModel: IonizedModel, quark: ModelQuark, getPreopData: GetPreopData | undefined) {
//    const performOp = useMutatingArrayOp(
//       ionizedModel,
//       quark,
//       <any[]>target,
//       'pop',
//       target.pop,
//       getPreopData,
//       deionizeArgs
//    )

//    return () => {
//       const prevLength = target.length;
//       const output = performOp()
//       $atomicPion(ionizedModel, (prevLength - 1).toString())?.trigger()
//       $atomicOp(ionizedModel, 'at', - 1)?.trigger()
//       return output;
//    }
// }


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

// function deionizeArgs(args: any[]) {
//    const _args = []
//    for (const arg of args) {
//       _args.push(toRaw(arg))
//    }
//    return _args;
// }




export function isIntegerKey(key: unknown) {
   if (typeof key === 'symbol') return false;
   const keyAsNumber = Number(key);
   if (isNaN(keyAsNumber)) return false;
   if (Number.isInteger(keyAsNumber)) return true
}


export function isIonizedArray(target: any): target is IonizedModel {
   if (!isIonizedModel(target)) return false;
   if (toRaw(target) instanceof Array) return true;
   return false;
}

// for .values(), .entries() and .keys() to output ionized objects

enlistIonizedMethods([].values().constructor as Constructor, {
   next: {
      privateState: true,
      type: OpType.TRACKABLE,
      output: maybeIonize,
      track: trackModel
   }
})



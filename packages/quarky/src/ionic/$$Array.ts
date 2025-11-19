import { AnyObject } from "@rue/types";
import { isIonicProxy, toRaw, ionize, IonizeBy, ToRaw, Ionic, } from "./ionize";
import { EACH, INTERNAL_OP, IonicProxy, isIntegerKey, maybeIonize } from "./Ionic";
import { MutatingOpDef, TrackableOpDef, trackModel, defineIonicStructure, Constructor, trackableOp } from "./IonicMethods";
import { track } from "../reactivity/Compound";


declare global {
   interface Array<T> {
      values<H>(this: H): ArrayIterator<IonizeBy<H, T>>;
      entries<H>(this: H): ArrayIterator<IonizeBy<H, T>>;

      at<H>(this: H, index: number): IonizeBy<H, T> | undefined;
      concat<H>(this: H, ...items: (IonizeBy<H, T> | IonizeBy<H, T>[])[]): IonizeBy<H, ToRaw<T>[]>;
      slice<H>(this: H, start?: number, end?: number): IonizeBy<H, ToRaw<T>[]>;

      // // Mutator methods
      copyWithin<H>(this: H, target: number, start: number, end?: number): IonizeBy<H, ToRaw<T>[]>;
      fill<H>(this: H, value: IonizeBy<H, T>, start?: number, end?: number): IonizeBy<H, ToRaw<T>[]>;
      pop<H>(this: H): IonizeBy<H, T> | undefined;
      push<H>(this: H, ...items: IonizeBy<H, T>[]): number;
      reverse<H>(this: H): IonizeBy<H, ToRaw<T>[]>;
      shift<H>(this: H): IonizeBy<H, T> | undefined;
      sort<H>(this: H, compareFn?: (a: IonizeBy<H, T>, b: IonizeBy<H, T>) => number): IonizeBy<H, ToRaw<T>[]>;
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
      ): IonizeBy<H, U>[];
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
      toSorted<H>(this: H, compareFn?: (a: IonizeBy<H, T>, b: IonizeBy<H, T>) => number): IonizeBy<H, T>[];
      toReversed<H>(this: H): IonizeBy<H, T>[];
      with<H>(this: H, index: number, value: IonizeBy<H, T>): IonizeBy<H, T>[];

      //flat // TODO:
      //flatMap

      [Symbol.iterator]<H>(): IonizeBy<H, IterableIterator<ToRaw<T>>>;
      ionizable: 'Array'
   }
}




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
//    type: MemberType.TRACKABLE,
//    // input: (args: any[]) => [toRaw(args[0]), args[1]]
// }



// const arrayLengthMutatingOp: Omit<MutatingOpDef, 'type'> = {
//    preop: (target) => ({ target, prevLength: target.length }),
//    // shouldTrigger: ({ target, prevLength }) => target.length !== prevLength, // only for length mutating ops 
// }

// const creativeOp: TrackableOpDef = {
//    type: MemberType.TRACKABLE,
//    output: ionize
// }

defineIonicStructure(Array, {
   '@initEach'(item, target, transform, index) {
      target[index] = transform(item)
   },

   '@getHookKey'(key){
      return isIntegerKey(key) ? EACH : key
   },

   at(index) {
      return this.ionic.at(index)
   },

   [Symbol.iterator]() {
      this.trackModel()
      return Ionic(this.raw[Symbol.iterator](), this.config)
   },

   concat(...args: any[]) {
      return Ionic(this.ionic.concat(...args), this.config)
   },

   keys() {
      this.track(INTERNAL_OP, 'ownKeys')
      return this.raw.keys()
   },

   slice(start, end) {
      return Ionic(this.ionic.slice(start, end), this.config)
   },

   // TODO: test if this functions properly
   toSpliced(...args: any[]) {
      return Ionic(this.ionic.toSpliced(...args), this.config)
   },

   splice(...args) {
      return Ionic(this.ionic.splice(...args), this.config)
   }
})
// function triggerModel(model: IonicProxy) { return [trigger(model)] }

// isEntryKey(model, key) {
//    return !!(model instanceof Array && isIntegerKey(key))
// },

// function useMutatingArrayOpFactory(
//    opName: string,
//    deionizeArgs?: (args: any[]) => any[]
// ) {
//    return function createOp(target: AnyObject, ionizedModel: IonicProxy, quark: ModelQuark, getPreopData: GetPreopData | undefined) {
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
//    model: IonicProxy,
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

// function createPopMethod(target: AnyObject, ionizedModel: IonicProxy, quark: ModelQuark, getPreopData: GetPreopData | undefined) {
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
//       getTrackedOp(ionizedModel, 'at', - 1)?.trigger()
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







export function isIonizedArray(target: any): target is IonicProxy {
   if (!isIonicProxy(target)) return false;
   if (toRaw(target) instanceof Array) return true;
   return false;
}

// for .values(), .entries() and .keys() to output ionized objects

defineIonicStructure(Iterator as unknown as Constructor, {
   next() {
      this.trackModel()
      return this.raw.next();
   }
})



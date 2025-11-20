import { AnyObject } from "@rue/types";
import { isIonicProxy, toRaw, ionize, IonizeBy, ToRaw, Ionic, } from "./x_ionize";
import { EACH, INTERNAL_OP, IonicProxy, isIntegerKey } from "./Ionic";
import { defineIonicCollective, Constructor, defineIonicCollection, IonicDef } from "./IonicDef";


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



defineIonicCollection(Array, {
   '@initEach'(item, target, transform, index) {
      target[index] = transform(item)
   },
   
   '@getHookKey'(key) {
      return isIntegerKey(key) ? EACH : key
   }
}, {
   [Symbol.iterator]() {
      this.trackModel()
      return Ionic(this.raw[Symbol.iterator]())
   },

   at(index) {
      return this.ionic.at(index)
   },

   concat(...args: any[]) {
      return Ionic(this.ionic.concat(...args), this.config)
   },

   keys() {
      this.track(INTERNAL_OP, 'ownKeys') // QUESTION: is this correct?
      return this.raw.keys()
   },

   slice(start?, end?) {
      return Ionic(this.ionic.slice(start, end), this.config)
   },

   // TODO: test if this functions properly
   toSpliced(start, deleteCount, ...args) {
      return Ionic(this.ionic.toSpliced(start, deleteCount, ...args), this.config)
   },

   splice(...args) {
      return Ionic(this.ionic.splice(...args), this.config)
   },

})

export function isIonizedArray(target: any): target is IonicProxy {
   if (!isIonicProxy(target)) return false;
   if (toRaw(target) instanceof Array) return true;
   return false;
}
